import express from "express";
import ejs from "ejs";
import mongoose from "mongoose";
import md5 from "md5";
import { titleCase } from "title-case";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use("/styles", express.static("public/styles"));
app.use(express.urlencoded({ extended: true }));

const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

mongoose
  .connect(
    `mongodb+srv://${MONGO_PASSWORD}@cluster0.8q3mhc3.mongodb.net/userDB?retryWrites=true&w=majority`
  )
  .then(() => console.log("db Connected"));

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  country: [],
});

const User = mongoose.model("User", userSchema);

const countrySchema = new mongoose.Schema({
  id: Number,
  country_code: String,
  country_name: String,
});

const Countries = mongoose.model("Countries", countrySchema);

async function visited(user) {
  const count = user.country;
  return count;
}

app.get("/", (req, res) => {
  res.render("root");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", async (req, res) => {
  const newUser = new User({
    email: req.body.email,
    password: md5(req.body.password),
  });
  const email = req.body.email.trim();
  const password = req.body.password.trim();
  const user = await User.findOne({ email: email });

  if (!email || !password) {
    res.render("signup", { para: "Invalid email or password !!!" });
    return;
  }

  if (!email.endsWith("@gmail.com")) {
    res.render("signup", {
      para: "Only email addresses are allowed !!!",
    });
    return;
  }

  if (password.length < 8) {
    res.render("signup", {
      para: "Password must be at least 8 characters !!!",
    });
    return;
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.render("signup", { para: "User already exists!!!" });
    } else {
      await newUser.save();
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error in /signup route:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/login", async (req, res) => {
  let email = req.body.email;
  const password = md5(req.body.password);
  const user = await User.findOne({ email: email });

  if (!user) {
    res.render("login", { para: "User doesn't exists !!!" });
  } else if (user.password === password) {
    const count = await visited(user);
    res.render("index", { countries: count, total: count.length });
  }

  app.post("/add", async (req, res) => {
    try {
      const input = titleCase(req.body.country);
      const place = await Countries.findOne({ country_name: input });
      const count = await visited(user);

      if (!place) {
        res.render("index", {
          error: "Country doesn't exist !!!",
          countries: count,
          total: count.length,
        });
      } else if (place) {
        const code = place.country_code;

        if (user.country.includes(code)) {
          res.render("index", {
            error: "Country already visited !!!",
            countries: count,
            total: count.length,
          });
        } else {
          user.country.push(code);
          await user.save();
          const updateCount = await visited(user);
          res.render("index", {
            countries: updateCount,
            total: updateCount.length,
          });
        }
      }
    } catch (error) {
      console.error("Error in /add route:", error);
      res.status(500).send("Internal Server Error");
    }
  });
});

app.listen(PORT, () => {
  console.log("Time To Create Miracles!!!");
});
