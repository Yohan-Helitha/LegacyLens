package lk.ac.sliit.legacylens.hiring.service;

import java.util.UUID;

/**
 * The boundary between this (elder-side hiring) module and the Admin/Archive
 * module: this module depends only on this interface, never on a concrete
 * Admin-module class (Dependency Inversion) — agree on this contract with
 * whoever builds Admin before either side changes it.
 */
public interface AdminNotificationPort {

    void notify(UUID jobRequestId);
}
