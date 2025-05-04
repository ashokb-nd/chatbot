// This is a Google Apps Script for a public notice board.
// it runs as a web app 

const SHEET_NAME = 'Notices'; // Name of the sheet to store data
const ID_COLUMN = 0;        // Column index for unique ID (hidden)
const AUTHOR_COLUMN = 1;    // Column index for author's name
const CONTENT_COLUMN = 2;   // Column index for notice content
const TIMESTAMP_COLUMN = 3; // Column index for timestamp
const GOOGLE_SHEET_ID = '1BCKToHLDuyo_iEAcg_QOwinZunFVbw8E5MqE0UVPVE0';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'getNotices') {
    const lastRowNumber = parseInt(e.parameter.lastRowNumber || 0);
    return getNotices(lastRowNumber);
  }

  return HtmlService.createHtmlOutputFromFile('index')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("Public Notice Board");
}

function getNotices(lastRowNumber = 0) {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({ notices: [], lastRowNumber: 0 }))
        .setMimeType(ContentService.MimeType.JSON);
  }

  const lastRow = sheet.getLastRow();
  if (lastRowNumber >= lastRow) {
    // No new rows to fetch
    return ContentService.createTextOutput(JSON.stringify({ notices: [], lastRowNumber }))
        .setMimeType(ContentService.MimeType.JSON);
  }

  const startRow = lastRowNumber > 0 ? lastRowNumber + 1 : Math.max(2, lastRow - 99); // Start from the next row or last 100 rows
  const range = sheet.getRange(startRow, 1, lastRow - startRow + 1, sheet.getLastColumn());
  const data = range.getValues();
  
  // Return the 2D array directly
  return ContentService.createTextOutput(JSON.stringify({ data, lastRowNumber: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);
}


// simply append row
function doPost(e) {
  const author = e.parameter.author;
  const content = e.parameter.content;
  const id = e.parameter.id 
  const timestamp = e.parameter.timestamp 

  if (!author || !content) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Author and content are required." }))
        .setMimeType(ContentService.MimeType.JSON);
  }

  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['ID', 'Author', 'Content', 'Timestamp']); // Add headers
  }

  sheet.appendRow([id, author, content, timestamp]);

  // Return success response without fetching notices
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
}