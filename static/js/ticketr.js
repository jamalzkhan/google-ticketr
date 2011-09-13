// It's a good idea to namespace any global stuff your application creates.
var ticketr = {
  database: null,
  targetVersion: "1.0"
};


// Let's deal with IDB prefixing.
window.indexedDB =
  window.indexedDB ||
  window.webkitIndexedDB ||
  window.mozIndexedDB;
window.IDBKeyRange =
  window.IDBKeyRange ||
  window.webkitIDBKeyRange;
window.IDBTransaction =
  window.IDBTransaction ||
  window.webkitIDBTransaction;


// We don't have to wait for the DOM to set up our database.
var openRequest = indexedDB.open(
  "ticketr", "Ticket data within."
);

openRequest.onsuccess = function(e) {
  ticketr.database = e.target.result;
  ticketr.database.onfailure = function(e) {
    // This is a catch-all error handler. You'll probably want to do something
    // useful here, like notifying the user about what went wrong.
    console.error("Something has gone wrong! Oh noes!");
  };
  if (ticketr.database.version != ticketr.targetVersion) {
    // Version mismatch, we need to migrate our schema.
    var migrationRequest = ticketr.database.setVersion(ticketr.targetVersion);
    migrationRequest.onsuccess = function(e) {
      
      var ticketStore = ticketr.database.createObjectStore("ticket", 
        {keyPath: "ticketNumber"}
      );
      console.log("the ticketStore was setup");
      // == EXERCISE 2 ==
      // You need to create an object store named 'ticket' with a keyPath
      // of ticketNumber.
      
      ticketStore.createIndex(
        "confirmation", "confirmation", {unique: true},
        "ticketNumber", "tickerNumber", {unique: true}
      );

      // == EXERCISE 3 ==
      // The ticketNumber field will be unique because it's the primary key,
      // but confirmations are unique as well. Add an index that will ensure
      // the uniqueness of the confirmation.
      
    };
  }
  ticketr.refreshTicketList();
};

ticketr.createTicket = function(ticket) {
  // == EXERCISE 4 ==
  // Take the ticket object and add it to the database.
  
  if (ticket.ticketNumber == ''){
    alert("Please enter a valid ticket number")
    return;
  }
  
  var transaction = ticketr.database.transaction(
    ["ticket"],
    IDBTransaction.READ_WRITE,
    0
  );
  
  var request = transaction.objectStore("ticket").put(ticket);
  
  // var request = transaction.objectStore("ticket").put({
  //     "ticketNumber": "1221264490",
  //     "confirmation": "QRDJDK",
  //     "airline": "Worldwide Airways"
  //   });
  
  request.onsuccess = function(e) {
    console.log("Great the record was added to the database");
    ticketr.refreshTicketList();
  }
  request.onfailure = function(e) {
    console.log("No! Something went wrong!");
  }
  
}

ticketr.deleteTicket = function(ticketKey) {

  var transaction = ticketr.database.transaction(
    ["ticket"],
    IDBTransaction.READ_WRITE,
    0
  );
  var store = transaction.objectStore("ticket");
  var request = store.delete(ticketKey);

    request.onsuccess = function(e) {
      console.log("Deleted successfully!")
      ticketr.refreshTicketList();
    };
    

    request.onerror = function(e) {
      console.log(e);
    };
  
}

ticketr.search = function(query) {
  $("#list > ul li:not(.header)").remove();
  
  // == EXTRA CREDIT ==
  // Add a search query input field to the top of the ticket list, wire it up
  // to call this function on each key-press, giving a search-as-you-type
  // function. You have a number of options here, with more complicated
  // options being worth more. Simple exact-matching on the ticket number is
  // the easiest to implement. You could also simultaneously search on all
  // fields. You might implement command-based queries, i.e.:
  // airline:"Worldwide Airlines" would indicate you're only searching on a
  // single field. And by far, the most complicated of all would be to allow
  // partial matches on any field, combined with the command-based query scheme
  // described above.
  
  var transaction = ticketr.database.transaction(
    ["ticket"],
    IDBTransaction.READ_WRITE,
    0
  );
  var store = transaction.objectStore("ticket");
  var keyRange = IDBKeyRange.lowerBound(0);
  var cursorRequest = store.openCursor(keyRange);

   cursorRequest.onsuccess = function(e) {
     var result = e.target.result;
     if(!!result == false){
       return;
     }
     
     
     var ticket = result.value;
     var test=new RegExp(query);
     //Matching on all 3 fields
     if(ticket.airline==query || ticket.confirmation==query ||ticket.ticketNumber==query){
       var ticketElement = ticketr.buildTicketElement(ticket);
       $("#list > ul").append(ticketElement);
     }
     //Partial matching
    else if(test.test(ticket.airline) || test.test(ticket.confirmation) || test.test(ticket.ticketNumber)){
      var ticketElement = ticketr.buildTicketElement(ticket);
      $("#list > ul").append(ticketElement);
    }
     
     result.continue();
   };
  
  
}

ticketr.refreshTicketList = function() {
  
  if (ticketr.database) {
    console.log("The database exists");
    $("#list > ul li:not(.header)").remove();
    // == EXERCISE 5 ==
    // Remove the example ticket boilerplate from the init method below, and
    // instead, query the database for the ticket data. Use the supplied
    // ticketr.buildTicketElement function to generate each ticket DOM structure.
    var transaction = ticketr.database.transaction(
      ["ticket"],
      IDBTransaction.READ_WRITE,
      0
    );

    var ticketStore = transaction.objectStore("ticket");
    // Get everything in the object store;
    var keyRange = IDBKeyRange.lowerBound(0);
    var cursorRequest = ticketStore.openCursor(keyRange);


    cursorRequest.onsuccess = function(e) {
      var result = e.target.result;
      if(!!result == false) return;
      var ticket = result.value;
      //Now we do something with the ticket
      
      var ticketElement = ticketr.buildTicketElement(ticket);
      $("#list > ul").append(ticketElement);
      result.continue();
    };
    console.log("Reached")
    // You can append a ticket element to the list like this:
    
  }
  
  
};

ticketr.buildTicketElement = function(ticket) {
  // This will create a structure like this:
  //
  // <li class="ticket">
  //   <hgroup>
  //     <span class="airline">Worldwide Airways</span>
  //   </hgroup>
  //   <div>
  //     <p>
  //       Ticket #: <span class="ticket-number">1234567890</span>
  //     </p>
  //     <p>
  //       Confirmation: <span class="confirmation">ABCDEF</span>
  //     </p>
  //   </div>
  // </li>

  var ticketElement = $(document.createElement("li"));
  ticketElement.addClass('ticket');
  var hgroup = $(document.createElement("hgroup"));
  ticketElement.append(hgroup);
  var airlineSpan = $(document.createElement("span"));
  airlineSpan.addClass('airline');
  airlineSpan.text(ticket.airline);
  hgroup.append(airlineSpan);

  var div = $(document.createElement("div"));
  ticketElement.append(div);

  var ticketNumberP = $(document.createElement("p"));
  ticketNumberP.text("Ticket #: ");
  var ticketNumberSpan = $(document.createElement("span"));
  ticketNumberSpan.addClass('ticket-number');
  ticketNumberSpan.text(ticket.ticketNumber);
  ticketNumberP.append(ticketNumberSpan);
  div.append(ticketNumberP);

  var confirmationP = $(document.createElement("p"));
  confirmationP.text("Confirmation: ");
  var confirmationSpan = $(document.createElement("span"));
  confirmationSpan.addClass('confirmation');
  confirmationSpan.text(ticket.confirmation);
  confirmationP.append(confirmationSpan);
  div.append(confirmationP);
  
  var deleteButton = $(document.createElement("button"));
  deleteButton.text("Delete");
  deleteButton.click(function (e){
    ticketr.deleteTicket(ticket.ticketNumber)
  });
  div.append(deleteButton);
  
  return ticketElement;
}

$(document).ready(function (e) {
  
  $("#add").click(function (e) {
    $("#edit").addClass("visible");
  });
  
  $("#search").click(function (e){
    var query = $("#search-term").val()
    console.log(query);
    ticketr.createTicket(query);
    ticketr.search(query);
  });
  
  $("#clear").click(function (e){
    ticketr.refreshTicketList();
  });
  
  
  $("#put").click(function (e) {
    $("#edit").removeClass("visible");
    var ticket = {
      ticketNumber: $("#ticket-number").val(),
      confirmation: $("#confirmation").val(),
      airline: $("#airline").val()
    };
    ticketr.createTicket(ticket);
  });

  ticketr.refreshTicketList(list);

});
