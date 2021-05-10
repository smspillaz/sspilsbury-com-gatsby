---
title: "Let your tests tell you when your code design sucks."
date: "2013-05-30"
post: true
description: Testing poorly written code reveals that it is poorly written
---

Google's [testing on the toilet](http://googletesting.blogspot.com.au/) blog is a really great read for people who are looking at getting into test-driven development and unit testing as a development methodology. Their most recent post called "[Don't overuse mocks](http://googletesting.blogspot.com.au/2013/05/testing-on-toilet-dont-overuse-mocks.html)" makes an important point - overmocking in your tests makes your tests less readable.

For the uninitiated, "mocking" in the unit-testing world is basically where you replace an interface with a "mock", whose behaviour can be specified at runtime. If the code that you're trying to get under test is dependent on some behaviour from an interface provided to it, then the mocking framework effectively allows you to specify that behaviour so that you can make your code do certain things.

For example:

```cpp
class Animal
{
    public:
        virtual bool feet () const = 0;
};

class Seal :
    public Animal
{
    public:
        Seal ()
        {
             makeLotsOfNoise ();
        }

    private:
        virtual bool feet () const { return false; }
};

bool canJump (Animal const &animal)
{
    return animal.feet ();
}
```

We want to test that `canJump` will return false if the animal has no feet and will return true if animal has feet. We don't want to depend on `Seal`, because its constructor makes lots of noise. Also, `Seal` might get feet in the future and that would make our test invalid. So we use a mock:

```cpp
class MockAnimal :
    public Animal
{
    public:

        MOCK_CONST_METHOD0 (feet, bool ());
}

TEST (Main, JumpIfFeet)
{
    MockAnimal animal;
    ON_CALL (animal, feet ()).WillByDefault (Return (true));
    EXPECT_TRUE (canJump (animal));
}

TEST (Main, NoJumpIfNotFeet)
{
    MockAnimal animal;
    ON_CALL (animal, feet ()).WillByDefault (Return (false));
    EXPECT_FALSE (canJump (animal));
}
```

The example in "Don't overuse mocks" is a bit more involved. It involves the use of mocking to control the interaction between a `CreditCardServer`, `TransactionManager`, `Transaction`, `Payment` and a `PaymentProcessor`. Here's the example of how its' done:

```java
public void testCreditCardIsCharged() {
  paymentProcessor = new PaymentProcessor(mockServer);
  when(mockServer.isServerAvailable()).thenReturn(true);
  when(mockServer.beginTransaction().thenReturn(mockManager);
  when(mockManager.getTransaction().thenReturn(transaction);
  when(mockServer.pay(transaction, creditCard,
                      500).thenReturn(**mockPayment**);
  when(**mockPayment**.isOverMaxBalance()).thenReturn(false);
  paymentProcessor.processPayment(creditCard, Money.dollars(500));
  verify(mockServer).pay(transaction, creditCard, 500);
}
```

[some of the variable names have been changed for the sake of line-wrapping]

Its quite clear that the usage of mocks in this case is used to describe a multi-step process:

1. The server must be available (say it is)
2. We need a TransactionManager from the server (return our mock one)
3. We need a Transaction from the TransactionManager (return our mock one)
4. We need a payment from the TransactionManager (return our mock one)
5. We need to know if the payment is over balance (say it isn't)

If all of those conditions are satisfied, then the payment should be processed on the server. The fact that we had to wriggle so much to get the paymentProcessor to call pay () results in a somewhat fragile test. If we added a new condition unrelated to what we are testing here then we also need to change the behaviour of the mocks otherwise that test will fail. This is the peril of "over-mocking" - you've removed a dependency on some behaviour, but you need to re-implement the rest yourself.

Testing on the Toilet's solution to this problem is "don't use mocking for stuff like this".

```java
public void testCreditCardIsCharged() {
  paymentProcessor = new PaymentProcessor(creditCardServer);
  paymentProcessor.processPayment(creditCard, Money.dollars(500));
  assertEquals(500, creditCardServer.getMostRecentCharge(creditCard));
}
```

And to some extent, they'd be right. But I think its treating the symptom (the test smell) as opposed to the problem (the code smell).

There are three real problems here:

1. `paymentProcessor.processPayment` does too much. It needs to ask if the server is running, ask for a transaction manager, ask for a transaction, ask for a payment and ask if the payment is over balance.
2. `paymentProcessor.processPayment` is also *asking* too much. It should be told what do rather than just being provided some interfaces and figuring out what to do.
3. `testCreditCardIsCharged` is too vague - what conditions exactly are we testing that the credit card is charged? Are we just testing that it is charged? Are we testing that it is charged when the payment server is available? Are we testing that it is charged when the payment is over balance? In reality, they're testing that a series of steps results in success rather that testing that the system behaves as expected under particular conditions.

How can we fix this?

Well, first of all, we should figure out what processPayment is doing and whether or not it can be split up. We don't have the code, but judging by the mock's behaviour - it does the following:

1. Checks if the server is running
2. Gets a payment object for the amount requested
3. Checks if the payment is over-balance
4. Calls pay () on the server

Steps 1 & 2 and 3 & 4 can really be split up into two separate functions. We're going to make one method get our payment () object from the server and another method responsible paying if appropriate. So we have:

1. Preconditions for being able to pay at all (server running, get objects)
2. Preconditions for being able to pay the amount requested (not over balance)
3. Postcondition (payment succeeded)

So lets do that:

```java
public class PaymentProcessor
{
    public Transaction prepareTransaction (CreditCardServer server)
    {
        if (!server.isServerAvailable ())
            return null;

        return server.beginTransaction ().getTransaction ();
    }

    public Payment preparePayment (Transaction transaction,
                                   Money money)
    {
        return new Payment (transaction, money);
    }

    public void processPayment (CreditCardServer server,
                                Transaction transaction,
                                Payment payment)
    {
        if (!payment.isOverMaxBalance ())
            server.pay (transaction, payment);
    }
}
```

Now, we have three distinct methods which each do different things. Now we want to test them.

The first thing we want to test is that a payment which is not over-balance is paid:

```java
public void testPaymentPaidIfNotOverBalance ()
{
    Payment payment = new Mock <Payment> ();
    when (payment, isOverMaxBalance ()).thenReturn (false);

    paymentProcessor.processPayment (mockServer,
                                     stubTransaction,
                                     payment);

    verify (mockServer, pay (stubTransaction, payment);
}
```

One assert done, two to go. Lets check that a non-active server does not give us a transaction to play with:

```java
public void testNoTransactionIfServerNotOnline ()
{
    Mock <CreditCardServer> server = new Mock <CreditCardServer> ();
    assertThat (paymentProcessor.prepareTransaction (server),
                IsNull ());
}
```

And now make sure that we get a payment object from our transaction

```java
public void testPaymentObtainedFromTransaction ()
{
    StubTransaction transaction;
    assertThat (paymentProcessor.preparePayment (transaction,
                                                 Money.dollars (500),
                NotNull ());
}
```

Our client code is going to be a little bit more involved now:

```java
Transaction transaction = processor.prepareTransaction (server);
Payment payment = processor.preparePayment (transaction,
                                            Money.dollars (500));
processor.processPayment (server, transaction, payment);
```

On the other hand we now know what the process is going to be within the client, and testing `PaymentProcess` is not so involved anymore, because each of its parts only perform a very specific task.

Also - in the client we don't ask for anything. We just tell the processor to prepare a transaction, prepare a payment and pay. And in the tests, we don't have to say "yes the transaction manager is running, yes, you can have a transaction" in order to make the part of the code responsible for paying if not over balance to work correctly. It just works correctly as long as you pass it some data it expects.

The moral of the story is: If you end up with fragile tests, go and have a look at your code. The tests will tell you if your interface sucks.
