---
title: "Apt is surprisingly flexible"
post: true
description: Running apt rootless without proot
date: "2017-01-04"
---

After a break for a few months, I just shipped a [new version](https://pypi.python.org/pypi/polysquare-travis-container/0.0.43) of [polysquare-travis-container](http://github.com/polysquare-travis-container). The main difference here is that we are now able to create and maintain containers without using proot at all, which is a slight improvement on the [last big round of changes made in August](https://smspillaz.wordpress.com/2016/08/07/improvements-to-polysquare-travis-container/).

The initial reason for using proot was to provide a simple way to fool apt and dpkg into thinking that it was running from the root directory when it was actually running from a directory owned by user. The theory goes that if you can fool apt into doing that, then you can install and run packages built for other distributions without the overhead of running virtual machines. As explained about [two years](https://smspillaz.wordpress.com/2015/01/04/creating-mini-distribution-containers-with-fake-root-access-on-travis-ci/) ago, the best solutions we have available for doing this are chroot (and wrappers around chroot) and Docker. However both of those require root access to make the chroot system call and/or set up cgroups. proot solves that problem by running your program through ptrace, then intercepting and rewriting system calls such that programs think they are running on the root directory.

However, as time went on, I encountered problems with the proot approach. Mixing redirection with environment variables like PATH tended to not work out so well. On newer ubuntu releases proot ran incredibly slowly. Then, finally, it just stopped working at all on Travis-CI, which kind of defeats the purpose of using it in polysquare-travis-container.

Earlier in 2015 I realised the solution was to take the same approach used by polysquare-travis-container's support for Windows and macOS - just set the right environment variables and support the packages which do the right thing and don't hardcode absolute paths. This has worked out surprisingly well. Supporting linux package managers was far trickier. I suppose a part of the problem here was that they have historically always run as the root user and as a result wrote directly to /usr and kept their data in /var. After all - they are there to manage the entire filesystem, so having those assumptions makes sense.

After the changes made in August, I wasn't too optimistic that it would be possible to run these package managers without using chroot or a chroot-alternative. But after some digging I found that Apt itself has a [test suite which has to run under the exact same constraints](https://anonscm.debian.org/git/apt/apt.git/tree/test/integration/framework#n325). As it turns out, pretty much every path in Apt is configurable to some extent, so much so that with an Apt configuration like below, you can run apt as a non-root user and have it keep all its changes in a specified directory.

```
Apt {
    Architecture "amd64";
    Get {
        Assume-Yes true;
    };
};
debug {
    nolocking true;
};
Acquire::Queue-Mode "host";
Dir "fakeroot";
Dir::Cache "fakeroot/var/cache/apt";
Dir::State "fakeroot/var/lib/apt";
Dir::State::status "fakeroot/var/lib/dpkg/status";
Dir::Bin::Solvers "fakeroot/usr/lib/apt/solvers";
Dir::Bin::Planners "fakeroot/usr/lib/apt/planners";
Dir::Bin::Solvers "fakeroot/usr/lib/apt/solvers";
Dir::Bin::Methods "fakeroot/usr/lib/apt/methods";
Dir::Bin::Dpkg "fakeroot/usr/bin/dpkg.w";
Dir::Etc "fakeroot/etc/apt";
Dir::Log "fakeroot/var/log/apt";
```

Along with Apt, you'll also need to tell Dpkg to run in a separate root directory. Thankfully, it has command line options to tell it to do this. The only problem is that Apt invokes the Dpkg binary on occasion and so you'll need to write a wrapper script to ensure that Dpkg gets called with the right command line arguments.

```shell
#!/bin/bash
fakeroot/usr/bin/dpkg --root='fakeroot' \
--admindir=fakeroot/var/lib/dpkg \
--log=fakeroot/var/log/dkpkg.log \
--force-not-root --force-bad-path $@
```

You'll notice above that I override the Dpkg binary with dpkg.w which contains the script contents above.

The final piece of the puzzle was to disable postinst, postrm and prerm scripts from running. These aren't necessary in these containers since they are mostly responsible for updating things like system caches or updating configuration files. The containers are meant to be one-off environments so all we care about are the binaries. Disabling them was as simple as removing them.

With all of that effort out of the way, we can now create and run a container without the use of docker, chroot or proot and install a completely separate toolchain and run binaries from it.

```shell
$ psq-travis-container-create --distro Ubuntu --release precise --arch x86_64 container --local --packages PACKAGES --repositories REPOSITORIES
```

```
Configured Distribution:
 - Release: precise
 - Package System: DpkgLocal
 - Architecture: x86_64
 - Distribution Name: Ubuntu
âœ“ Using existing folder for proot distro Ubuntu precise amd64
-> Update repositories [apt-get update -y --force-yes]
   Get:1 http://archive.ubuntu.com precise Release.gpg [198 B]
   Get:2 http://archive.ubuntu.com precise-security Release.gpg [198 B]
   Get:3 http://archive.ubuntu.com precise-updates Release.gpg [198 B]
   Get:4 http://ppa.launchpad.net precise Release.gpg [316 B]
   Get:5 http://ppa.launchpad.net precise Release.gpg [316 B]
   Get:6 http://archive.ubuntu.com precise Release [49.6 kB]
   Get:7 http://ppa.launchpad.net precise Release [13.0 kB]
   Ign http://ppa.launchpad.net precise Release
   Get:8 http://llvm.org llvm-toolchain-precise-3.6 Release.gpg [836 B]
   Get:9 http://ppa.launchpad.net precise Release [12.9 kB]
   Ign http://ppa.launchpad.net precise Release
   Get:10 http://archive.ubuntu.com precise-security Release [55.5 kB]
   Get:11 http://ppa.launchpad.net precise/main amd64 Packages [592 B]
   Get:12 http://ppa.launchpad.net precise/main TranslationIndex [196 B]
   Get:13 http://archive.ubuntu.com precise-updates Release [55.4 kB]
   Get:14 http://ppa.launchpad.net precise/main amd64 Packages [49.1 kB]
   Get:15 http://llvm.org llvm-toolchain-precise-3.6 Release [3,355 B]
   Ign http://llvm.org llvm-toolchain-precise-3.6 Release
   Get:16 http://archive.ubuntu.com precise/main Sources [934 kB]
   Get:17 http://ppa.launchpad.net precise/main TranslationIndex [205 B]
   Get:18 http://ppa.launchpad.net precise/main Translation-en [310 B]
   Get:19 http://ppa.launchpad.net precise/main Translation-en [15.2 kB]
   Get:20 http://archive.ubuntu.com precise/restricted Sources [5,470 B]
   Get:21 http://archive.ubuntu.com precise/main amd64 Packages [1,273 kB]
   Ign http://llvm.org llvm-toolchain-precise-3.6/main TranslationIndex
   Get:22 http://archive.ubuntu.com precise/restricted amd64 Packages [8,452 B]
   Get:23 http://archive.ubuntu.com precise/main TranslationIndex [3,706 B]
   Get:24 http://archive.ubuntu.com precise/restricted TranslationIndex [2,596 B]
   Get:25 http://archive.ubuntu.com precise-security/main Sources [146 kB]
   Get:26 http://archive.ubuntu.com precise-security/restricted Sources [4,623 B]
   Get:27 http://archive.ubuntu.com precise-security/main amd64 Packages [664 kB]
   Get:28 http://archive.ubuntu.com precise-security/restricted amd64 Packages [10.8 kB]
   Get:29 http://archive.ubuntu.com precise-security/main TranslationIndex [208 B]
   Get:30 http://archive.ubuntu.com precise-security/restricted TranslationIndex [202 B]
   Get:31 http://archive.ubuntu.com precise-updates/main Sources [500 kB]
   Get:32 http://archive.ubuntu.com precise-updates/restricted Sources [8,840 B]
   Get:33 http://archive.ubuntu.com precise-updates/main amd64 Packages [1,045 kB]
   Get:34 http://archive.ubuntu.com precise-updates/restricted amd64 Packages [15.4 kB]
   Get:35 http://archive.ubuntu.com precise-updates/main TranslationIndex [208 B]
   Get:36 http://archive.ubuntu.com precise-updates/restricted TranslationIndex [202 B]
   Get:37 http://archive.ubuntu.com precise/main Translation-en_AU [4,434 B]
   Get:38 http://archive.ubuntu.com precise/main Translation-en [726 kB]
   Get:39 http://archive.ubuntu.com precise/restricted Translation-en_AU [2,407 B]
   Get:40 http://archive.ubuntu.com precise/restricted Translation-en [2,395 B]
   Get:41 http://archive.ubuntu.com precise-security/main Translation-en [269 kB]
   Get:42 http://archive.ubuntu.com precise-security/restricted Translation-en [2,793 B]
   Get:43 http://archive.ubuntu.com precise-updates/main Translation-en [431 kB]
   Get:44 http://archive.ubuntu.com precise-updates/restricted Translation-en [3,682 B]
   Get:45 http://llvm.org llvm-toolchain-precise-3.6/main amd64 Packages [6,216 B]
   Ign http://llvm.org llvm-toolchain-precise-3.6/main Translation-en_AU
   Ign http://llvm.org llvm-toolchain-precise-3.6/main Translation-en
   Fetched 6,328 kB in 16s (389 kB/s)
   Reading package lists...
   W: GPG error: http://ppa.launchpad.net precise Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY C1DB487B944B6EA7
   W: GPG error: http://ppa.launchpad.net precise Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 1E9377A2BA9EF27F
   W: GPG error: http://llvm.org llvm-toolchain-precise-3.6 Release: The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 15CF4D18AF4F7421
-> Downloading APT packages and dependencies [apt-get -y --force-yes -d install --reinstall nano cmake clang-3.6]
   Reading package lists...
   Building dependency tree...
   Reading state information...
   The following extra packages will be installed:
     adduser binutils bsdmainutils busybox-initramfs ca-certificates cmake-data
     cpio emacsen-common gcc-4.9-base gcc-6-base ifupdown initramfs-tools
     initramfs-tools-bin initscripts insserv iproute klibc-utils libarchive12
     libasan1 libasn1-8-heimdal libatomic1 libblkid1 libbsd0 libc-bin
     libc-dev-bin libc6 libc6-dev libcilkrts5 libclang-common-3.6-dev
     libclang1-3.6 libcomerr2 libcurl3 libcurl3-gnutls libdbus-1-3 libdrm-intel1
     libdrm-nouveau1a libdrm-radeon1 libdrm2 libedit2 libexpat1 libgcc-4.9-dev
     libgcc1 libgcrypt11 libglib2.0-0 libgnutls26 libgomp1 libgpg-error0
     libgssapi-krb5-2 libgssapi3-heimdal libhcrypto4-heimdal libheimbase1-heimdal
     libheimntlm0-heimdal libhx509-5-heimdal libidn11 libitm1 libk5crypto3
     libkeyutils1 libklibc libkrb5-26-heimdal libkrb5-3 libkrb5support0
     libldap-2.4-2 libllvm3.6 liblsan0 libmount1 libncurses5 libncursesw5
     libnettle4 libnih-dbus1 libnih1 libobjc-4.9-dev libobjc4 libp11-kit0
     libpciaccess0 libpcre3 libplymouth2 libpng12-0 libquadmath0
     libroken18-heimdal librtmp0 libsasl2-2 libslang2 libsqlite3-0 libssl1.0.0
     libstdc++-4.9-dev libstdc++6 libtasn1-3 libtsan0 libubsan0 libudev0 libuuid1
     libwind0-heimdal libxml2 libxmlrpc-core-c3 linux-libc-dev lsb-base
     module-init-tools mount mountall ncurses-bin openssl passwd plymouth procps
     sysv-rc sysvinit-utils udev upstart util-linux
   Suggested packages:
     liblocale-gettext-perl perl-modules binutils-doc cpp wamerican wordlist
     whois vacation gnustep gnustep-devel clang-3.6-doc gcc make libarchive1
     isc-dhcp-client dhcp-client ppp rdnssd net-tools bash-completion bootchart
     iproute-doc glibc-doc locales rng-tools gnutls-bin krb5-doc krb5-user
     pciutils libstdc++-4.9-doc nfs-common spell sysv-rc-conf bum sash watershed
     graphviz util-linux-locales kbd console-tools dosfstools
   Recommended packages:
     ecryptfs-utils llvm-3.6-dev python psmisc e2fsprogs libatm1 manpages-dev
     dbus libglib2.0-data shared-mime-info krb5-locales libgpm2 libsasl2-modules
     uuid-runtime xml-core plymouth-theme-ubuntu-text plymouth-theme
   The following NEW packages will be installed:
     adduser binutils bsdmainutils busybox-initramfs ca-certificates clang-3.6
     cmake cmake-data cpio emacsen-common gcc-4.9-base gcc-6-base ifupdown
     initramfs-tools initramfs-tools-bin initscripts insserv iproute klibc-utils
     libarchive12 libasan1 libasn1-8-heimdal libatomic1 libblkid1 libbsd0
     libc-dev-bin libc6-dev libcilkrts5 libclang-common-3.6-dev libclang1-3.6
     libcomerr2 libcurl3 libcurl3-gnutls libdbus-1-3 libdrm-intel1
     libdrm-nouveau1a libdrm-radeon1 libdrm2 libedit2 libexpat1 libgcc-4.9-dev
     libgcrypt11 libglib2.0-0 libgnutls26 libgomp1 libgpg-error0 libgssapi-krb5-2
     libgssapi3-heimdal libhcrypto4-heimdal libheimbase1-heimdal
     libheimntlm0-heimdal libhx509-5-heimdal libidn11 libitm1 libk5crypto3
     libkeyutils1 libklibc libkrb5-26-heimdal libkrb5-3 libkrb5support0
     libldap-2.4-2 libllvm3.6 liblsan0 libmount1 libncurses5 libncursesw5
     libnettle4 libnih-dbus1 libnih1 libobjc-4.9-dev libobjc4 libp11-kit0
     libpciaccess0 libpcre3 libplymouth2 libpng12-0 libquadmath0
     libroken18-heimdal librtmp0 libsasl2-2 libslang2 libsqlite3-0 libssl1.0.0
     libstdc++-4.9-dev libtasn1-3 libtsan0 libubsan0 libudev0 libuuid1
     libwind0-heimdal libxml2 libxmlrpc-core-c3 linux-libc-dev lsb-base
     module-init-tools mount mountall nano ncurses-bin openssl passwd plymouth
     procps sysv-rc sysvinit-utils udev upstart util-linux
   The following packages will be upgraded:
     libc-bin libc6 libgcc1 libstdc++6
   4 to upgrade, 108 to newly install, 0 to remove and 18 not to upgrade.
   Need to get 96.1 MB of archives.
   After this operation, 260 MB of additional disk space will be used.
   WARNING: The following packages cannot be authenticated!
     gcc-6-base libgcc1 libstdc++6 gcc-4.9-base libasan1 libatomic1 libcilkrts5
     libllvm3.6 libgomp1 libitm1 liblsan0 libtsan0 libubsan0 libquadmath0
     libgcc-4.9-dev libstdc++-4.9-dev libobjc4 libobjc-4.9-dev libclang1-3.6
     libclang-common-3.6-dev clang-3.6
   Get:1 http://archive.ubuntu.com/ubuntu/ precise-security/main libc-bin amd64 2.15-0ubuntu10.15 [1,177 kB]
   Get:2 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main gcc-6-base amd64 6.2.0-3ubuntu11~12.04 [18.1 kB]
   Get:3 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libgcc1 amd64 1:6.2.0-3ubuntu11~12.04 [44.6 kB]
   Get:4 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libstdc++6 amd64 6.2.0-3ubuntu11~12.04 [391 kB]
   Get:5 http://llvm.org/apt/precise/ llvm-toolchain-precise-3.6/main libllvm3.6 amd64 1:3.6.2~svn240577-1~exp1 [11.5 MB]
   Get:6 http://archive.ubuntu.com/ubuntu/ precise-security/main libc6 amd64 2.15-0ubuntu10.15 [4,636 kB]
   Get:7 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main gcc-4.9-base amd64 4.9.4-2ubuntu1~12.04 [16.9 kB]
   Get:8 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libasan1 amd64 4.9.4-2ubuntu1~12.04 [240 kB]
   Get:9 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libatomic1 amd64 6.2.0-3ubuntu11~12.04 [10.8 kB]
   Get:10 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libcilkrts5 amd64 6.2.0-3ubuntu11~12.04 [49.6 kB]
   Get:11 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libgomp1 amd64 6.2.0-3ubuntu11~12.04 [85.6 kB]
   Get:12 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libitm1 amd64 6.2.0-3ubuntu11~12.04 [34.3 kB]
   Get:13 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main liblsan0 amd64 6.2.0-3ubuntu11~12.04 [136 kB]
   Get:14 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libtsan0 amd64 6.2.0-3ubuntu11~12.04 [324 kB]
   Get:15 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libubsan0 amd64 6.2.0-3ubuntu11~12.04 [125 kB]
   Get:16 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libquadmath0 amd64 6.2.0-3ubuntu11~12.04 [146 kB]
   Get:17 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libgcc-4.9-dev amd64 4.9.4-2ubuntu1~12.04 [3,761 kB]
   Get:18 http://archive.ubuntu.com/ubuntu/ precise-security/main libdbus-1-3 amd64 1.4.18-1ubuntu1.8 [146 kB]
   Get:19 http://archive.ubuntu.com/ubuntu/ precise-updates/main libnih1 amd64 1.0.3-4ubuntu9.1 [54.8 kB]
   Get:20 http://archive.ubuntu.com/ubuntu/ precise-updates/main libnih-dbus1 amd64 1.0.3-4ubuntu9.1 [16.0 kB]
   Get:21 http://llvm.org/apt/precise/ llvm-toolchain-precise-3.6/main libclang1-3.6 amd64 1:3.6.2~svn240577-1~exp1 [5,398 kB]
   Get:22 http://archive.ubuntu.com/ubuntu/ precise-updates/main libudev0 amd64 175-0ubuntu9.10 [27.8 kB]
   Get:23 http://archive.ubuntu.com/ubuntu/ precise-updates/main sysvinit-utils amd64 2.88dsf-13.10ubuntu11.1 [60.2 kB]
   Get:24 http://archive.ubuntu.com/ubuntu/ precise/main insserv amd64 1.14.0-2.1ubuntu2 [50.9 kB]
   Get:25 http://archive.ubuntu.com/ubuntu/ precise-updates/main sysv-rc all 2.88dsf-13.10ubuntu11.1 [44.6 kB]
   Get:26 http://archive.ubuntu.com/ubuntu/ precise/main ncurses-bin amd64 5.9-4 [151 kB]
   Get:27 http://archive.ubuntu.com/ubuntu/ precise-updates/main lsb-base all 4.0-0ubuntu20.3 [10.5 kB]
   Get:28 http://archive.ubuntu.com/ubuntu/ precise-security/main libpcre3 amd64 8.12-4ubuntu0.2 [149 kB]
   Get:29 http://archive.ubuntu.com/ubuntu/ precise-updates/main libglib2.0-0 amd64 2.32.4-0ubuntu1 [1,200 kB]
   Get:30 http://archive.ubuntu.com/ubuntu/ precise/main module-init-tools amd64 3.16-1ubuntu2 [105 kB]
   Get:31 http://archive.ubuntu.com/ubuntu/ precise-security/main initramfs-tools-bin amd64 0.99ubuntu13.5 [9,782 B]
   Get:32 http://archive.ubuntu.com/ubuntu/ precise/main libklibc amd64 1.5.25-1ubuntu2 [45.7 kB]
   Get:33 http://archive.ubuntu.com/ubuntu/ precise/main klibc-utils amd64 1.5.25-1ubuntu2 [181 kB]
   Get:34 http://archive.ubuntu.com/ubuntu/ precise-updates/main busybox-initramfs amd64 1:1.18.5-1ubuntu4.1 [183 kB]
   Get:35 http://archive.ubuntu.com/ubuntu/ precise-security/main cpio amd64 2.11-7ubuntu3.2 [116 kB]
   Get:36 http://archive.ubuntu.com/ubuntu/ precise/main libncurses5 amd64 5.9-4 [114 kB]
   Get:37 http://archive.ubuntu.com/ubuntu/ precise/main libslang2 amd64 2.2.4-3ubuntu1 [503 kB]
   Get:38 http://archive.ubuntu.com/ubuntu/ precise-updates/main libblkid1 amd64 2.20.1-1ubuntu3.1 [73.7 kB]
   Get:39 http://archive.ubuntu.com/ubuntu/ precise-updates/main libmount1 amd64 2.20.1-1ubuntu3.1 [71.5 kB]
   Get:40 http://archive.ubuntu.com/ubuntu/ precise-updates/main mount amd64 2.20.1-1ubuntu3.1 [166 kB]
   Get:41 http://archive.ubuntu.com/ubuntu/ precise-updates/main util-linux amd64 2.20.1-1ubuntu3.1 [596 kB]
   Get:42 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libstdc++-4.9-dev amd64 4.9.4-2ubuntu1~12.04 [1,867 kB]
   Get:43 http://archive.ubuntu.com/ubuntu/ precise-security/main initramfs-tools all 0.99ubuntu13.5 [49.0 kB]
   Get:44 http://archive.ubuntu.com/ubuntu/ precise/main libncursesw5 amd64 5.9-4 [137 kB]
   Get:45 http://archive.ubuntu.com/ubuntu/ precise-updates/main procps amd64 1:3.2.8-11ubuntu6.4 [233 kB]
   Get:46 http://archive.ubuntu.com/ubuntu/ precise/main adduser all 3.113ubuntu2 [133 kB]
   Get:47 http://archive.ubuntu.com/ubuntu/ precise-updates/main udev amd64 175-0ubuntu9.10 [324 kB]
   Get:48 http://archive.ubuntu.com/ubuntu/ precise-security/main libdrm2 amd64 2.4.52-1~precise2 [26.1 kB]
   Get:49 http://archive.ubuntu.com/ubuntu/ precise-updates/main libpciaccess0 amd64 0.12.902-1ubuntu0.2 [20.8 kB]
   Get:50 http://archive.ubuntu.com/ubuntu/ precise-security/main libdrm-intel1 amd64 2.4.52-1~precise2 [65.6 kB]
   Get:51 http://archive.ubuntu.com/ubuntu/ precise-security/main libdrm-nouveau1a amd64 2.4.52-1~precise2 [14.0 kB]
   Get:52 http://archive.ubuntu.com/ubuntu/ precise-security/main libdrm-radeon1 amd64 2.4.52-1~precise2 [27.8 kB]
   Get:53 http://archive.ubuntu.com/ubuntu/ precise-security/main libpng12-0 amd64 1.2.46-3ubuntu4.2 [133 kB]
   Get:54 http://archive.ubuntu.com/ubuntu/ precise-updates/main libplymouth2 amd64 0.8.2-2ubuntu31.1 [92.0 kB]
   Get:55 http://archive.ubuntu.com/ubuntu/ precise-updates/main plymouth amd64 0.8.2-2ubuntu31.1 [123 kB]
   Get:56 http://archive.ubuntu.com/ubuntu/ precise-updates/main mountall amd64 2.36.4ubuntu0.1 [67.5 kB]
   Get:57 http://archive.ubuntu.com/ubuntu/ precise-updates/main initscripts amd64 2.88dsf-13.10ubuntu11.1 [28.1 kB]
   Get:58 http://archive.ubuntu.com/ubuntu/ precise-updates/main iproute amd64 20111117-1ubuntu2.3 [444 kB]
   Get:59 http://archive.ubuntu.com/ubuntu/ precise-updates/main ifupdown amd64 0.7~beta2ubuntu11.1 [48.3 kB]
   Get:60 http://archive.ubuntu.com/ubuntu/ precise-updates/main upstart amd64 1.5-0ubuntu7.3 [309 kB]
   Get:61 http://archive.ubuntu.com/ubuntu/ precise-updates/main passwd amd64 1:4.1.4.2+svn3283-3ubuntu5.1 [959 kB]
   Get:62 http://llvm.org/apt/precise/ llvm-toolchain-precise-3.6/main libclang-common-3.6-dev amd64 1:3.6.2~svn240577-1~exp1 [1,756 kB]
   Get:63 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libobjc4 amd64 6.2.0-3ubuntu11~12.04 [162 kB]
   Get:64 http://archive.ubuntu.com/ubuntu/ precise-updates/main libuuid1 amd64 2.20.1-1ubuntu3.1 [12.8 kB]
   Get:65 http://archive.ubuntu.com/ubuntu/ precise-security/main libsqlite3-0 amd64 3.7.9-2ubuntu1.2 [349 kB]
   Get:66 http://ppa.launchpad.net//ubuntu-toolchain-r/test/ubuntu/ precise/main libobjc-4.9-dev amd64 4.9.4-2ubuntu1~12.04 [799 kB]
   Get:67 http://archive.ubuntu.com/ubuntu/ precise-updates/main libcomerr2 amd64 1.42-1ubuntu2.3 [57.2 kB]
   Get:68 http://archive.ubuntu.com/ubuntu/ precise-security/main libssl1.0.0 amd64 1.0.1-4ubuntu5.38 [1,055 kB]
   Get:69 http://archive.ubuntu.com/ubuntu/ precise-updates/main libroken18-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [46.0 kB]
   Get:70 http://archive.ubuntu.com/ubuntu/ precise-updates/main libasn1-8-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [220 kB]
   Get:71 http://archive.ubuntu.com/ubuntu/ precise/main libbsd0 amd64 0.3.0-2 [31.6 kB]
   Get:72 http://archive.ubuntu.com/ubuntu/ precise/main libgpg-error0 amd64 1.10-2ubuntu1 [14.5 kB]
   Get:73 http://archive.ubuntu.com/ubuntu/ precise-security/main libgcrypt11 amd64 1.5.0-3ubuntu0.6 [282 kB]
   Get:74 http://archive.ubuntu.com/ubuntu/ precise/main libp11-kit0 amd64 0.12-2ubuntu1 [34.3 kB]
   Get:75 http://archive.ubuntu.com/ubuntu/ precise-security/main libtasn1-3 amd64 2.10-1ubuntu1.5 [43.6 kB]
   Get:76 http://archive.ubuntu.com/ubuntu/ precise-security/main libgnutls26 amd64 2.12.14-5ubuntu3.12 [460 kB]
   Get:77 http://archive.ubuntu.com/ubuntu/ precise-security/main libkrb5support0 amd64 1.10+dfsg~beta1-2ubuntu0.7 [24.9 kB]
   Get:78 http://archive.ubuntu.com/ubuntu/ precise-security/main libk5crypto3 amd64 1.10+dfsg~beta1-2ubuntu0.7 [80.1 kB]
   Get:79 http://archive.ubuntu.com/ubuntu/ precise/main libkeyutils1 amd64 1.5.2-2 [7,862 B]
   Get:80 http://archive.ubuntu.com/ubuntu/ precise-security/main libkrb5-3 amd64 1.10+dfsg~beta1-2ubuntu0.7 [355 kB]
   Get:81 http://archive.ubuntu.com/ubuntu/ precise-security/main libgssapi-krb5-2 amd64 1.10+dfsg~beta1-2ubuntu0.7 [119 kB]
   Get:82 http://archive.ubuntu.com/ubuntu/ precise-security/main libidn11 amd64 1.23-2ubuntu0.1 [112 kB]
   Get:83 http://archive.ubuntu.com/ubuntu/ precise-updates/main libhcrypto4-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [103 kB]
   Get:84 http://llvm.org/apt/precise/ llvm-toolchain-precise-3.6/main clang-3.6 amd64 1:3.6.2~svn240577-1~exp1 [37.1 MB]
   Get:85 http://archive.ubuntu.com/ubuntu/ precise-updates/main libheimbase1-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [33.1 kB]
   Get:86 http://archive.ubuntu.com/ubuntu/ precise-updates/main libwind0-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [77.8 kB]
   Get:87 http://archive.ubuntu.com/ubuntu/ precise-updates/main libhx509-5-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [125 kB]
   Get:88 http://archive.ubuntu.com/ubuntu/ precise-updates/main libkrb5-26-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [234 kB]
   Get:89 http://archive.ubuntu.com/ubuntu/ precise-updates/main libheimntlm0-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [16.0 kB]
   Get:90 http://archive.ubuntu.com/ubuntu/ precise-updates/main libgssapi3-heimdal amd64 1.6~git20120311.dfsg.1-2ubuntu0.1 [108 kB]
   Get:91 http://archive.ubuntu.com/ubuntu/ precise-updates/main libsasl2-2 amd64 2.1.25.dfsg1-3ubuntu0.1 [69.1 kB]
   Get:92 http://archive.ubuntu.com/ubuntu/ precise-security/main libldap-2.4-2 amd64 2.4.28-1.1ubuntu4.6 [185 kB]
   Get:93 http://archive.ubuntu.com/ubuntu/ precise/main librtmp0 amd64 2.4~20110711.gitc28f1bab-1 [57.1 kB]
   Get:94 http://archive.ubuntu.com/ubuntu/ precise-security/main openssl amd64 1.0.1-4ubuntu5.38 [524 kB]
   Get:95 http://archive.ubuntu.com/ubuntu/ precise-security/main ca-certificates all 20160104ubuntu0.12.04.1 [208 kB]
   Get:96 http://archive.ubuntu.com/ubuntu/ precise-security/main libcurl3-gnutls amd64 7.22.0-3ubuntu4.17 [228 kB]
   Get:97 http://archive.ubuntu.com/ubuntu/ precise/main libedit2 amd64 2.11-20080614-3ubuntu2 [70.3 kB]
   Get:98 http://archive.ubuntu.com/ubuntu/ precise-security/main libxml2 amd64 2.7.8.dfsg-5.1ubuntu4.15 [677 kB]
   Get:99 http://archive.ubuntu.com/ubuntu/ precise/main libnettle4 amd64 2.4-1 [95.1 kB]
   Get:100 http://archive.ubuntu.com/ubuntu/ precise-security/main libarchive12 amd64 3.0.3-6ubuntu1.3 [274 kB]
   Get:101 http://archive.ubuntu.com/ubuntu/ precise-security/main libc-dev-bin amd64 2.15-0ubuntu10.15 [84.7 kB]
   Get:102 http://archive.ubuntu.com/ubuntu/ precise-security/main linux-libc-dev amd64 3.2.0-119.162 [850 kB]
   Get:103 http://archive.ubuntu.com/ubuntu/ precise-security/main libc6-dev amd64 2.15-0ubuntu10.15 [2,943 kB]
   Get:104 http://archive.ubuntu.com/ubuntu/ precise-security/main libcurl3 amd64 7.22.0-3ubuntu4.17 [237 kB]
   Get:105 http://archive.ubuntu.com/ubuntu/ precise-security/main libexpat1 amd64 2.0.1-7.2ubuntu1.4 [131 kB]
   Get:106 http://archive.ubuntu.com/ubuntu/ precise/main bsdmainutils amd64 8.2.3ubuntu1 [200 kB]
   Get:107 http://archive.ubuntu.com/ubuntu/ precise/main nano amd64 2.2.6-1 [194 kB]
   Get:108 http://archive.ubuntu.com/ubuntu/ precise-security/main binutils amd64 2.22-6ubuntu1.4 [2,653 kB]
   Get:109 http://archive.ubuntu.com/ubuntu/ precise-security/main libxmlrpc-core-c3 amd64 1.16.33-3.1ubuntu5.2 [180 kB]
   Get:110 http://archive.ubuntu.com/ubuntu/ precise/main emacsen-common all 1.4.22ubuntu1 [16.9 kB]
   Get:111 http://archive.ubuntu.com/ubuntu/ precise-updates/main cmake-data all 2.8.7-0ubuntu5 [754 kB]
   Get:112 http://archive.ubuntu.com/ubuntu/ precise-updates/main cmake amd64 2.8.7-0ubuntu5 [4,353 kB]
   Fetched 96.1 MB in 1min 36s (995 kB/s)
   Download complete and in download only mode
-> Unpacking  libc-dev-bin_2.15-0ubuntu10.15_amd64
-> Unpacking  libcilkrts5_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libcomerr2_1.42-1ubuntu2.3_amd64
-> Unpacking  libasan1_4.9.4-2ubuntu1~12.04_amd64
-> Unpacking  libc-bin_2.15-0ubuntu10.15_amd64
-> Unpacking  util-linux_2.20.1-1ubuntu3.1_amd64
-> Unpacking  libpng12-0_1.2.46-3ubuntu4.2_amd64
-> Unpacking  libkrb5-3_1.10+dfsg~beta1-2ubuntu0.7_amd64
-> Unpacking  libasn1-8-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  insserv_1.14.0-2.1ubuntu2_amd64
-> Unpacking  libgssapi3-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  libdrm-intel1_2.4.52-1~precise2_amd64
-> Unpacking  libuuid1_2.20.1-1ubuntu3.1_amd64
-> Unpacking  ca-certificates_20160104ubuntu0.12.04.1_all
-> Unpacking  libitm1_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  liblsan0_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libllvm3.6_1%3a3.6.2~svn240577-1~exp1_amd64
-> Unpacking  libexpat1_2.0.1-7.2ubuntu1.4_amd64
-> Unpacking  upstart_1.5-0ubuntu7.3_amd64
-> Unpacking  libstdc++6_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libkrb5support0_1.10+dfsg~beta1-2ubuntu0.7_amd64
-> Unpacking  emacsen-common_1.4.22ubuntu1_all
-> Unpacking  libgpg-error0_1.10-2ubuntu1_amd64
-> Unpacking  libp11-kit0_0.12-2ubuntu1_amd64
-> Unpacking  libubsan0_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libobjc4_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libkeyutils1_1.5.2-2_amd64
-> Unpacking  libbsd0_0.3.0-2_amd64
-> Unpacking  libheimntlm0-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  gcc-4.9-base_4.9.4-2ubuntu1~12.04_amd64
-> Unpacking  libheimbase1-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  passwd_1%3a4.1.4.2+svn3283-3ubuntu5.1_amd64
-> Unpacking  ifupdown_0.7~beta2ubuntu11.1_amd64
-> Unpacking  libk5crypto3_1.10+dfsg~beta1-2ubuntu0.7_amd64
-> Unpacking  libsasl2-2_2.1.25.dfsg1-3ubuntu0.1_amd64
-> Unpacking  libnih1_1.0.3-4ubuntu9.1_amd64
-> Unpacking  binutils_2.22-6ubuntu1.4_amd64
-> Unpacking  libxml2_2.7.8.dfsg-5.1ubuntu4.15_amd64
-> Unpacking  libdrm-nouveau1a_2.4.52-1~precise2_amd64
-> Unpacking  libblkid1_2.20.1-1ubuntu3.1_amd64
-> Unpacking  libmount1_2.20.1-1ubuntu3.1_amd64
-> Unpacking  libldap-2.4-2_2.4.28-1.1ubuntu4.6_amd64
-> Unpacking  libdrm2_2.4.52-1~precise2_amd64
-> Unpacking  initramfs-tools-bin_0.99ubuntu13.5_amd64
-> Unpacking  libquadmath0_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libclang-common-3.6-dev_1%3a3.6.2~svn240577-1~exp1_amd64
-> Unpacking  libpcre3_8.12-4ubuntu0.2_amd64
-> Unpacking  libnih-dbus1_1.0.3-4ubuntu9.1_amd64
-> Unpacking  linux-libc-dev_3.2.0-119.162_amd64
-> Unpacking  libudev0_175-0ubuntu9.10_amd64
-> Unpacking  libatomic1_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libgcc1_1%3a6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libgcc-4.9-dev_4.9.4-2ubuntu1~12.04_amd64
-> Unpacking  libgomp1_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libwind0-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  ncurses-bin_5.9-4_amd64
-> Unpacking  libarchive12_3.0.3-6ubuntu1.3_amd64
-> Unpacking  libncurses5_5.9-4_amd64
-> Unpacking  libtasn1-3_2.10-1ubuntu1.5_amd64
-> Unpacking  cpio_2.11-7ubuntu3.2_amd64
-> Unpacking  gcc-6-base_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  libslang2_2.2.4-3ubuntu1_amd64
-> Unpacking  libdbus-1-3_1.4.18-1ubuntu1.8_amd64
-> Unpacking  libnettle4_2.4-1_amd64
-> Unpacking  libcurl3_7.22.0-3ubuntu4.17_amd64
-> Unpacking  libc6_2.15-0ubuntu10.15_amd64
-> Unpacking  libgcrypt11_1.5.0-3ubuntu0.6_amd64
-> Unpacking  libdrm-radeon1_2.4.52-1~precise2_amd64
-> Unpacking  plymouth_0.8.2-2ubuntu31.1_amd64
-> Unpacking  sysv-rc_2.88dsf-13.10ubuntu11.1_all
-> Unpacking  librtmp0_2.4~20110711.gitc28f1bab-1_amd64
-> Unpacking  iproute_20111117-1ubuntu2.3_amd64
-> Unpacking  module-init-tools_3.16-1ubuntu2_amd64
-> Unpacking  libpciaccess0_0.12.902-1ubuntu0.2_amd64
-> Unpacking  libxmlrpc-core-c3_1.16.33-3.1ubuntu5.2_amd64
-> Unpacking  nano_2.2.6-1_amd64
-> Unpacking  sysvinit-utils_2.88dsf-13.10ubuntu11.1_amd64
-> Unpacking  initscripts_2.88dsf-13.10ubuntu11.1_amd64
-> Unpacking  libsqlite3-0_3.7.9-2ubuntu1.2_amd64
-> Unpacking  libc6-dev_2.15-0ubuntu10.15_amd64
-> Unpacking  libhx509-5-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  libedit2_2.11-20080614-3ubuntu2_amd64
-> Unpacking  libclang1-3.6_1%3a3.6.2~svn240577-1~exp1_amd64
-> Unpacking  libglib2.0-0_2.32.4-0ubuntu1_amd64
-> Unpacking  cmake-data_2.8.7-0ubuntu5_all
-> Unpacking  libklibc_1.5.25-1ubuntu2_amd64
-> Unpacking  initramfs-tools_0.99ubuntu13.5_all
-> Unpacking  lsb-base_4.0-0ubuntu20.3_all
-> Unpacking  libgnutls26_2.12.14-5ubuntu3.12_amd64
-> Unpacking  libroken18-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  libidn11_1.23-2ubuntu0.1_amd64
-> Unpacking  openssl_1.0.1-4ubuntu5.38_amd64
-> Unpacking  libcurl3-gnutls_7.22.0-3ubuntu4.17_amd64
-> Unpacking  libobjc-4.9-dev_4.9.4-2ubuntu1~12.04_amd64
-> Unpacking  mount_2.20.1-1ubuntu3.1_amd64
-> Unpacking  cmake_2.8.7-0ubuntu5_amd64
-> Unpacking  clang-3.6_1%3a3.6.2~svn240577-1~exp1_amd64
-> Unpacking  procps_1%3a3.2.8-11ubuntu6.4_amd64
-> Unpacking  libhcrypto4-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  libtsan0_6.2.0-3ubuntu11~12.04_amd64
-> Unpacking  adduser_3.113ubuntu2_all
-> Unpacking  busybox-initramfs_1%3a1.18.5-1ubuntu4.1_amd64
-> Unpacking  libkrb5-26-heimdal_1.6~git20120311.dfsg.1-2ubuntu0.1_amd64
-> Unpacking  libssl1.0.0_1.0.1-4ubuntu5.38_amd64
-> Unpacking  udev_175-0ubuntu9.10_amd64
-> Unpacking  libncursesw5_5.9-4_amd64
-> Unpacking  libgssapi-krb5-2_1.10+dfsg~beta1-2ubuntu0.7_amd64
-> Unpacking  libplymouth2_0.8.2-2ubuntu31.1_amd64
-> Unpacking  mountall_2.36.4ubuntu0.1_amd64
-> Unpacking  klibc-utils_1.5.25-1ubuntu2_amd64
-> Unpacking  bsdmainutils_8.2.3ubuntu1_amd64
-> Unpacking  libstdc++-4.9-dev_4.9.4-2ubuntu1~12.04_amd64
Container has been set up in container
```
