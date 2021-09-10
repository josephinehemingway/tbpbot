var token = <YOUR BOT TOKEN>;
var telegramUrl = "https://api.telegram.org/bot" + token;
var webAppUrl = <WEB APP URL>;

// future features
// message summary for orders every day - DONE
// view orders for today, tomorrow, next 3 days (using inline keyboard) - DONE
// 

// whitelisted account ids
var userList = [] //enter userid here

var keyBoard = {
    "inline_keyboard": [
      [{
        "text": "View Sales Summary",
        "callback_data": "sales summary"
      }],
      [{
        "text": "View Expense Summary",
        "callback_data": "expense summary"
      }],
      [{
        "text": "New Order Instructions",
        "callback_data": "new order"
      }, {
        "text": "New Expense Instructions",
        "callback_data": "new expense"
      }],
      [{
        "text": "View Future Orders",
        "callback_data": "orders"
      }],
      [{
        "text": "View Full Spreadsheet",
        "url": <SPREADSHEET URL>
      }],
    ]
};

var futureOrderskeyBoard = {
    "inline_keyboard": [
      [{
        "text": "Today",
        "callback_data": "today"
      },{
        "text": "Tomorrow",
        "callback_data": "tomorrow"
      }],
      [{
        "text": "Next 3 Days",
        "callback_data": "next3Days"
      }, {
        "text": "Next 7 Days",
        "callback_data": "next7Days"
      }],
      [{
        "text": "Back to Start",
        "callback_data": "start"
      }],
    ]
};

function setWebhook() {
  var url = telegramUrl + "/setWebhook?url=" + webAppUrl;
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText())
}

function sendMessage(id, text, keyBoard) {
  var url = telegramUrl + "/" 

  var data = {
    method: "post",
    payload: {
      method: "sendMessage",
      chat_id: String(id),
      text: text,
      parse_mode: "HTML",
      reply_markup: JSON.stringify(keyBoard)
    }
  };
  
  UrlFetchApp.fetch(url, data);
}

function onEdit(event){
  var sheet = event.source.getActiveSheet();
  var editedCell = sheet.getActiveCell();

  var columnToSortBy = 4; //sort by date
  var tableRange = "A7:J952";

  if(editedCell.getColumn() == columnToSortBy){   
    var range = sheet.getRange(tableRange);
    range.sort( { column : columnToSortBy } );
  }
}

function start(id) {
  if (userList.indexOf(id) == -1){
    return sendMessage(id, "Restricted user!")
  } else {

  var reply = "Hello! Use this bot to enter transactions and expenses!" + "\n\n" + "Type /start or any word to display this prompt again! \n\nPlease select options below:"

    return sendMessage(id, reply, keyBoard)
  }
}

function addExpense(id){
  var prompt = "Please enter in the following format: \n\n<b>Expenses/E/e</b>\nReceipt Date (DD/MM/YY)\nSupplier \nReceipt Number \nReceipt Amount \nPayment mode";
  return sendMessage(id, prompt);
}

function addOrder(id){
  var prompt = "Please enter in the following format: \n\n<b>Order Form/O/o</b>\nDelivery Date (DD/MM/YY)\nAmount \nTele/WA/IG \nBuyer Username \nPaylah/PayNow/Cash \n\nOrder template";
  return sendMessage(id, prompt);
}

function getFutureOrders(id){
  var prompt = "View orders for:";
  return sendMessage(id, prompt, futureOrderskeyBoard);
}

function getSalesSummary(id, orderSummarySheet){
  var salesByMonth = [];
  var sales = "";
  var lr = orderSummarySheet.getDataRange().getLastRow();
  
  var total = orderSummarySheet.getRange(lr,2).getValue();
  var totalSummary = "<b>Grand total: $" + total + "</b>\n";
  salesByMonth.push(totalSummary);

  for (var i = 4; i < lr; i++){
    var month = orderSummarySheet.getRange(i,1).getValue();
    var amount = orderSummarySheet.getRange(i,2).getValue();

    sales = month + ": $" + amount
    salesByMonth.push(sales);

    var salesSummaryList = salesByMonth.join("\n")
  }

  return sendMessage(id, decodeURI("SALES SUMMARY \n\n" + salesSummaryList));
}

function getOrdersTdyTmr(id, orderSheet, tdyTmr) {
  var orders = [];
  var order = "";
  var lr = orderSheet.getDataRange().getLastRow();

  for (var i = 7; i <= lr; i++){
    var date = orderSheet.getRange(i,4).getValue();
    var rawOrderDetails = orderSheet.getRange(i,3).getValue();
    // break the textblock into an array of lines
    var lines = rawOrderDetails.split('\n');
    // remove 2 lines, starting at the first position
    lines.splice(0,2);
    // join the array back into a single string
    var orderDetails = lines.join('\n');
    
    var tdyOrTmr = new Date();
    tdyOrTmr.setHours(00,00,00,00);
    if (tdyTmr === "tomorrow"){
      tdyOrTmr.setDate(tdyOrTmr.getDate() + 1);
    }
    var checkDate = Date.parse(date);
    var dateObj = new Date(checkDate);

    if (checkDate === Date.parse(tdyOrTmr)) {
      order = "--------------------------------------------\n" + dateObj.toString('dddd, MMMM ,yyyy') + "\n" + orderDetails
      orders.push(order)

      var orderList = orders.join("\n\n")
    } 
  }

  if (orders.length > 0){
    return sendMessage(id, decodeURI("<b>" + orders.length + " orders for " + tdyTmr + ": </b>\n%0A" + orderList));
  } else if (orders.length == 0) {
    return sendMessage(id, decodeURI(orders.length + " orders for " + tdyTmr ));
  }
}

function getOrdersNextiDays(id, orderSheet, i) {
  var orders = [];
  var order = "";
  var lr = orderSheet.getDataRange().getLastRow();

  for (var k = 7; k <= lr; k++){
    var date = orderSheet.getRange(k,4).getValue();
    var amt = orderSheet.getRange(k,5).getValue();
    var channel = orderSheet.getRange(k,6).getValue();
    var buyer = orderSheet.getRange(k,7).getValue();
    var orderDetails = buyer + " | " + channel + " | " + "$" + amt;
    
    var todayDate = new Date();
    todayDate.setHours(00,00,00,00);
    var nextiDays = new Date();
    nextiDays.setDate(nextiDays.getDate() + i);
    var checkDate = Date.parse(date);
    var dateObj = new Date(checkDate);

    if (checkDate >= Date.parse(todayDate) && checkDate < Date.parse(nextiDays)) {
      order = "--------------------------------------------\n" + dateObj.toString('dddd, MMMM ,yyyy') + "\n" + orderDetails
      orders.push(order)

      var orderList = orders.join("\n\n")
    } 
  }

  if (orders.length > 0){
    return sendMessage(id, decodeURI("<b>" + orders.length + " orders for next " + i + " days: </b> \n%0A" + orderList));
  } else if (orders.length == 0) {
    return sendMessage(id, decodeURI(orders.length + " orders for next " + i + " days"));
  }
}

function doPost(e) {
  var contents = JSON.parse(e.postData.contents);

  // spreadsheet ID
  var ssId = <SSID>;
  var orderSheet = SpreadsheetApp.openById(ssId).getSheetByName("Orders");
  var expenseSheet = SpreadsheetApp.openById(ssId).getSheetByName("Expenses");
  var expenseSummary = SpreadsheetApp.openById(ssId).getSheetByName("Expenses Summary");
  var salesSummary = SpreadsheetApp.openById(ssId).getSheetByName("Sales Summary");

  if (contents.callback_query) {
    var id = contents.callback_query.from.id;
    var data = contents.callback_query.data;

    if (userList.indexOf(id) !== -1){
      if (data == "expense summary") {
        var totalExpenses = expenseSheet.getDataRange().getCell(3,2).getValue();
        var response = "Total expenses: $" + totalExpenses
        return sendMessage(id, response);
      } else if (data == "sales summary") {
        getSalesSummary(id, salesSummary);
      } else if (data == "new order") {
        addOrder(id);
      } else if (data == "new expense") {
        addExpense(id);
      } else if (data == "orders"){
        getFutureOrders(id);
      } else if (data == "start"){
        start(id); 
      } else if (data == "tomorrow"){
        getOrdersTdyTmr(id, orderSheet, "tomorrow");
      } else if (data == "today"){
        getOrdersTdyTmr(id, orderSheet, "today");
      } else if (data == "next3Days"){
        getOrdersNextiDays(id, orderSheet, 3);
      } else if (data == "next7Days"){
        getOrdersNextiDays(id, orderSheet, 7)
      }
    } else {
      sendMessage(id, "Restricted User!");
    }
    
  } else if (contents.message) {
    var id = contents.message.from.id;
    var text = contents.message.text;
    var user = contents.message.from.username;
    
    if (text.indexOf("\n") !== -1 && userList.indexOf(id) !== -1){
      // Appending data into corresponding sheets
      var dateNow = new Date;
      var dataItems = text.split('\n');

      if (dataItems[0] == "Expenses" || dataItems[0] == "E" || dataItems[0] == "e"){
        var columnToSortBy = 3;
        var tableRange = "A7:I952";
        var range = expenseSheet.getRange(tableRange);

        var d1 = dataItems[1].split("/");
        var receiptDate = new Date("20"+ d1[2], parseInt(d1[1])-1, d1[0]);

        var receiptNo = dataItems[3];
        var lr = expenseSheet.getDataRange().getLastRow();

        for (var i = 7; i <= lr; i++){
          var rcptNo = expenseSheet.getRange(i,5).getValue();

          if (typeof rcptNo === "number") {
            if (receiptNo.trim() == rcptNo){ //receiptNo is always a string, .trim applies to string only
              return sendMessage(id, "Receipt already added!");
            }
            continue
          } else {
            if ((receiptNo.trim()).toLowerCase() == (rcptNo.trim()).toLowerCase()){
              return sendMessage(id, "Receipt already added!");
            }
          }
        }

        expenseSheet.appendRow([dateNow, user, receiptDate, dataItems[2], dataItems[3], dataItems[4], dataItems[5]]);
        range.sort( { column : columnToSortBy } ); //sort after each append
        return sendMessage(id, "Added new expense!");

      } else if (dataItems[0] == "Order Form" || dataItems[0] == "O" || dataItems[0] == "o"){
        var columnToSortBy = 4;
        var tableRange = "A7:J952";
        var lr = orderSheet.getDataRange().getLastRow() + 1;
        var range = orderSheet.getRange(tableRange);

        if (dataItems[0] == "Order Form"){
          orderSheet.appendRow([dateNow, user, text]);
          range.sort( { column : columnToSortBy } );

        } else if (dataItems[0] == "O" || dataItems[0] == "o"){
          var d1 = dataItems[1].split("/");
          var deliveryDate = new Date("20"+ d1[2], parseInt(d1[1])-1, d1[0]);
          var formula = "=IF(ISERROR(SEARCH(\"ocbc\",H" + lr + ")),\"N\",\"Y\")";

          orderSheet.appendRow([dateNow, user, text, deliveryDate, dataItems[2], dataItems[3], dataItems[4], dataItems[5], formula]);
          range.sort( { column : columnToSortBy } );
        }
        return sendMessage(id, "Added new order!\n\nClick below to view future orders:", futureOrderskeyBoard);
      } else {
        return sendMessage(id, "Invalid format, click below for templates or more actions!", keyBoard);
      }
    }
    else {
      start(id);
    }
  }
}




















