---
name: google-apps-suite-dev
description: Comprehensive guide and best practices for developing solutions using Google AppSheet, Google Apps Script, and Looker Studio. Use this skill when the user asks for help with any of these tools or for architectural advice on the Google ecosystem.
---

# Google Apps Suite Development Skill

This skill provides a standardized approach to building applications within the Google ecosystem, focusing on AppSheet, Apps Script, and Looker Studio.

## 1. AppSheet Development

### Data Modeling

* **Normalization**: Avoid wide tables with repeating groups (e.g., `Item1`, `Item2`). Use child tables and `Ref` columns instead.
* **Keys**: Always use a dedicated `ID` column with `UNIQUEID()` as the initial value. Avoid using physical row numbers (`_RowNumber`) or meaningful data (e.g., Names, Emails) as keys.
* **Virtual Columns**: Use them for computations that strictly display data (e.g., `[Price] * [Quantity]`). Heavy usage can slow down sync times.
  * *Best Practice*: If a calculation rarely changes, consider using a real column and a spreadsheet formula or an Automation to set the value.

### Expressions & Formulas

* **Performance**:
  * Avoid usage of `SELECT()` inside virtual columns if possible.
  * Prefer user settings or slices to filter data over complex security filters if the dataset is large.
* **Common Patterns**:
  * *Dereference*: `[RefColumn].[TargetColumn]` (Equivalent to SQL JOIN).
  * *Filtered Lookup*: `LOOKUP(MAXROW("Table", "Date", [_THISROW].[Customer] = [Customer]), "Table", "ID", "Status")`.

### UX/UI

* **Dashboards**: Use interactive dashboards by enabling "Interactive Mode" in the Dashboard view settings.
* **Show_If**: logic should be as simple as possible.
* **Actions**: Use "Display" settings to group actions logically (e.g., "Prominent", "Inline").

### Automation

* **Bots**: Break down complex logic into step-by-step processes.
* **Wait Steps**: Use wait steps for asynchronous operational workflows, but be aware of the limitations (deployment requirements).

## 2. Google Apps Script

### Core Principles

* **Batch Operations**: *Never* read/write cells in a loop.
  * *Bad*: Loop 100 times calling `sheet.getRange(i, 1).getValue()`.
  * *Good*: `sheet.getRange(1, 1, 100, 1).getValues()` (Read once, process in memory).
* **Triggers**:
  * `onEdit(e)`: logic must be fast (30s limit). Cannot call external APIs (UrlFetchApp) without an installable trigger.
  * *Installable Triggers*: Use for complex workflows or when permissions are required (e.g., sending emails).

### Code Structure (Pattern)

```javascript
// CONTROLLER: Main entry point
function handleNewSubmission(e) {
  try {
    const data = parseEvent(e);
    processBusinessLogic(data);
  } catch (err) {
    Logger.log("Error: " + err.toString());
    // Optional: Send error notification
  }
}

// SERVICE: Business Logic
function processBusinessLogic(data) {
  // .. operations ..
}

// DAO: Data Access
function getSpreadsheetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  // ...
}
```

## 3. Looker Studio

### Connection

* **Native vs. Database**: Connecting directly to Sheets is common but can be slow. For larger datasets (>50k rows), consider moving data to BigQuery or using AppSheet's native connector if available.

### Visualization Tips

* **Calculated Fields**: Do data prep in the source (Sheets/AppSheet) whenever possible. Doing complex regex or case-when in Looker Studio can degrade report performance.
* **Filters**: Use report-level filters to allow users to slice data dynamically.

## 4. Ecosystem Integration

### AppSheet -> Apps Script

* **Method**: Use the "Call a script" task in an AppSheet Automation.
* **Arguments**: Pass primitives (Strings, Numbers). If passing a Date, convert it to a string (`TEXT([Date], "yyyy-MM-dd")`) to guarantee format consistency.

### AppSheet -> Looker Studio

* Use the "Google AppSheet" connector in Looker Studio for the most consistent view of your data (respects Virtual Columns).
