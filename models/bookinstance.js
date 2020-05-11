var mongoose = require("mongoose");
const dateFns = require("date-fns");

var Schema = mongoose.Schema;

var BookInstanceSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: "Book", required: true }, //reference to the associated book
  imprint: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Available", "Maintenance", "Loaned", "Reserved"],
    default: "Maintenance",
  },
  due_back: { type: Date, default: Date.now },
});

// Virtual for bookinstance's URL
BookInstanceSchema.virtual("url").get(function () {
  return "/catalog/bookinstance/" + this._id;
});

// due date virtual
BookInstanceSchema.virtual("due_back_formatted").get(function () {
  return dateFns.format(this.due_back, "MMMM do, yyyy");
});

// due date formatted virtual for form
BookInstanceSchema.virtual("due_back_form").get(function () {
  if (this.due_back) {
    return dateFns.format(this.due_back, "yyyy-MM-dd");
  } else {
    return "";
  }
});

//Export model
module.exports = mongoose.model("BookInstance", BookInstanceSchema);
