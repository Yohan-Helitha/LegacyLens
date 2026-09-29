package lk.ac.sliit.legacylens.hiring.service;

/** Confirms the current stub implementation satisfies the shared contract. */
class MessagingChannelPortImplContractTest extends MessagingChannelPortContractTest {

    @Override
    protected MessagingChannelPort getPort() {
        return new MessagingChannelPortImpl();
    }
}
