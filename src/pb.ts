import PouchDB from "pouchdb-browser";

export const localDB = new PouchDB("local_notes");

localDB
  .changes({
    since: "now",
  })
  .on("change", function (change) {
    console.log("change");
  });
