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
    return getNotices();
  }

  return HtmlService.createHtmlOutputFromFile('index')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("Public Notice Board");
}

function getNotices() {
  const ss = SpreadsheetApp.openById(GOOGLE_SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  const notices = [];
  for (let i = 1; i < data.length; i++) {
    notices.push({
      id: data[i][ID_COLUMN],
      author: data[i][AUTHOR_COLUMN],
      content: data[i][CONTENT_COLUMN],
      timestamp: Utilities.formatDate(new Date(data[i][TIMESTAMP_COLUMN]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
    });
  }
  notices.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return ContentService.createTextOutput(JSON.stringify(notices))
      .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const author = e.parameter.author;
  const content = e.parameter.content;

  // const author = 'me';
  // const content = 'fslfjsl';

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

  const timestamp = new Date();
  const id = Utilities.getUuid(); // Generate a unique ID

  sheet.appendRow([id, author, content, timestamp]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
}