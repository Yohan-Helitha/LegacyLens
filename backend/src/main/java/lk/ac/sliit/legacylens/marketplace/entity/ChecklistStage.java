package lk.ac.sliit.legacylens.marketplace.entity;

/**
 * Which workflow stage a checklist item belongs to. Drives the Prep/Record/
 * Edit/Submit stepper on Continue My Work: a stage is only shown as done once
 * every item tagged with it is checked off, so the stepper always reflects
 * which specific task was completed rather than an overall percentage
 * crossing some threshold.
 */
public enum ChecklistStage {
    PREP,
    RECORD,
    EDIT,
    SUBMIT
}
