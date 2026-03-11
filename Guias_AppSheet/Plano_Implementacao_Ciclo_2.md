# Implementation Plan - Cycle 2

## Goal Description
Improve data integrity by restricting where Patients can be created and tracking the duration of their stay (Active vs Discharged).

## User Review Required
> [!IMPORTANT]
> **Action Required:** You will need to modify your Google Sheet columns and AppSheet configuration manually following these steps, as I cannot directly access your AppSheet editor.

## Proposed Changes

### 1. Restrict Patient Registration
**Problem:** Users can currently create "incomplete" patients via the "New" button in the Visits dropdown.
**Solution:** Create a "Read-Only" Slice for the dropdown menu.
*   **Create Slice:** `Pacientes_Select`
    *   Source Table: `Pacientes`
    *   Update Mode: `Updates_Only` (Uncheck "Adds")
*   **Update Column:** In `Visitas` table, change the `Paciente` column:
    *   Source Table: Change from `Pacientes` to `Pacientes_Select` (Slice).

### 2. Add Date Tracking
**Problem:** Need to track when a patient became Active and when they were Discharged.
**Solution:**
*   **Google Sheet (`Pacientes` tab):**
    *   Add Column: `Data Inicio`
    *   Add Column: `Data Alta`
*   **AppSheet (`Pacientes` table):**
    *   Regenerate Structure.
    *   **Configure `Data Inicio`:**
        *   Type: `Date`
        *   Initial Value: `TODAY()`
        *   Required: `TRUE`
    *   **Configure `Data Alta`:**
        *   Type: `Date`
        *   Editable: `TRUE` (Allow manual adjustment if needed)
        *   **Automation (Recommended):** Create a Bot to set this date automatically when Status changes to "Alta".
        *   *Alternative (Simpler):* Use `ChangeTimestamp` type for `Data Alta`? (Might be too technical).
        *   *Selected Approach:* We will use a simple **App Formula** with a condition or an **Automation**.
        *   *Refined Approach:* Set `Data Alta` Initial Value to `""`. Create an **Automation** that runs on "Updates to Pacientes" where `[Status]` changes to `"Alta"`. Action: "Set values of some columns" -> `Data Alta` = `TODAY()`.

## Verification Plan
### Manual Verification
1.  **Test Restriction:** Go to "Visitas" form. Click "Paciente" dropdown. Verify "New" button is GONE.
2.  **Test Registration:** Go to "Pacientes" view. Add new patient. Verify `Data Inicio` defaults to today.
3.  **Test Discharge:** Edit a patient, change Status to "Alta". Save. Sync. Verify `Data Alta` is populated (if Automation is used) or manually enter it.
