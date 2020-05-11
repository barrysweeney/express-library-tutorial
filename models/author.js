var mongoose = require("mongoose");
const dateFns = require("date-fns");

var Schema = mongoose.Schema;

var AuthorSchema = new Schema({
  first_name: { type: String, required: true, max: 100 },
  family_name: { type: String, required: true, max: 100 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

// Virtual for author's full name
AuthorSchema.virtual("name").get(function () {
  // To avoid errors in cases where an author does not have either a family name or first name
  // We want to make sure we handle the exception by returning an empty string for that case

  var fullname = "";
  if (this.first_name && this.family_name) {
    fullname = this.family_name + ", " + this.first_name;
  }
  if (!this.first_name || !this.family_name) {
    fullname = "";
  }

  return fullname;
});

// Virtual for author's URL
AuthorSchema.virtual("url").get(function () {
  return "/catalog/author/" + this._id;
});

// Virtual for view template date formats
AuthorSchema.virtual("formBirthDate").get(function () {
  if (this.date_of_birth) {
    return dateFns.format(this.date_of_birth, "yyyy-MM-dd");
  } else {
    return "";
  }
});

AuthorSchema.virtual("formDeathDate").get(function () {
  if (this.date_of_death) {
    return dateFns.format(this.date_of_death, "yyyy-MM-dd");
  } else {
    return "";
  }
});

// virtual for lifespan
AuthorSchema.virtual("lifespan").get(function () {
  let lifespan = " - ";
  if (this.date_of_birth) {
    lifespan = dateFns.format(this.date_of_birth, "MMMM do, yyyy") + lifespan;
  }
  if (this.date_of_death) {
    lifespan = lifespan + dateFns.format(this.date_of_death, "MMMM do, yyyy");
  }

  return lifespan;
});

//Export model
module.exports = mongoose.model("Author", AuthorSchema);
