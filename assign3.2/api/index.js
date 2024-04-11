import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";

/* Be sure to use DATABASE_NAME in your call to .db(), so we can change the constant while grading. */
let DATABASE_NAME = "cs193x_assign3";
let DATABASE_URL = "mongodb://127.0.0.1";

/* Do not modify or remove this line. It allows us to change the database for grading */
if (process.env.DATABASE_NAME) DATABASE_NAME = process.env.DATABASE_NAME;

let api = express.Router();
let users;
let posts;

const initApi = async (app) => {
  app.set("json spaces", 2);
  app.use("/api", api);

  //TODO: Set up database connection and collection variables
  let conn = await MongoClient.connect(DATABASE_URL);
  let db = conn.db(DATABASE_NAME);
  users = db.collection("users");
  posts = db.collection("posts");
};

api.use(bodyParser.json());
api.use(cors());

api.get("/", async (req, res) => {
  let usersArray = await users.find({}).toArray(); // lấy tất cả user
  let postsArray = await users.find({}).toArray(); // lấy tất cả post
  res.json({
    db: DATABASE_NAME, // tên database 
    numUsers: usersArray.length, // số lượng user
    numPosts: postsArray.length, // số lượng post
  });
});

// lấy tất cả user trong database
api.get("/users", async (req, res) => {
  let usersArray = await users.find({}).toArray(); // lấy tất cả user
  let data = { users: [] }; // tạo mảng chứa user
  for (let i of usersArray) { // duyệt qua từng user
    data.users.push(i.id); // thêm id của user vào mảng
  }
  res.json(data); // trả về mảng chứa id của user
});

// lấy bài viết của user theo id
api.get("/users/:id/posts", async (req, res) => {
  let data = {
    posts: [], // mảng chứa bài viết
  };
  let userId = req.params.id; // lấy id của user
  let user = await users.find({ id: userId }).toArray(); // tìm user theo id
  if (user.length !== 1) { // nếu không tìm thấy user
    res.status(404).json({ error: `No user with ID ${userId}` }); // trả về thông báo lỗi
    return;
  }
  let postArray = await posts.find({ userId: userId }).toArray(); // lấy tất cả bài viết của user
  for (let i of postArray) { // duyệt qua từng bài viết
    data.posts.push({ // thêm thông tin bài viết vào mảng
      user: {
        id: user[0].id, // id của user
        name: user[0].name,
        avatarURL: user[0].avatarURL,
      },
      time: i.time,
      text: i.text,
    });
  }
  // follow user
  for (let followId of user[0].following) { 
    let followUser = await users.find({ id: followId }).toArray(); // tìm user theo id
    let followPostArray = await posts.find({ userId: followId }).toArray(); // lấy tất cả bài viết của user
    for (let i of followPostArray) {
      data.posts.push({
        user: {
          id: followUser[0].id,
          name: followUser[0].name,
          avatarURL: followUser[0].avatarURL,
        },
        time: i.time,
        text: i.text,
      });
    }
  }

  // sắp xếp bài viết theo thời gian giảm dần
  data.posts.sort((lhs, rhs) => {
    if (lhs.time > rhs.time) {
      return -1;
    }
    if (lhs.time < rhs.time) {
      return 1;
    }
    return 0;
  });
  res.json(data);
});

api.get("/users/:id", async (req, res) => {
  let userId = req.params.id;
  let user = await users.find({ id: userId }).toArray();
  if (user.length !== 1) {
    res.status(404).json({ error: `No user with ID ${userId}` });
    return;
  }
  res.json({
    id: userId,
    name: user[0].name,
    avatarURL: user[0].avatarURL,
    following: user[0].following,
  });
});

// tạo user mới
api.post("/users", async (req, res) => {
if (!req.body.id || req.body.id.length === 0) { // nếu không có id hoặc id rỗng
    res.status(400).json({ // trả về thông báo lỗi
      error: "the request body is missing an id property or the id is empty",
    });
    return;
  }
  let newUserId = req.body.id; // lấy id của user
  let newUserName = req.body.name; // lấy tên của user
  let user = await users.find({ id: newUserId }).toArray(); // tìm user theo id
  if (user.length !== 0) { // nếu user đã tồn tại
    res.status(400).json({ error: "the user already exits" }); // trả về thông báo lỗi
    return;
  }
  let data = { // tạo user mới
    id: newUserId, // id của user
    name: newUserName, // tên của user
    avatarURL: "images/default.png",
    following: [],
  };
  await users.insertOne(data); // thêm user vào database
  delete data._id; // xóa _id
  res.json(data);
});

// cập nhật thông tin user
api.patch("/users/:id", async (req, res) => {
  let userId = req.params.id; // lấy id của user
  let user = await users.find({ id: userId }).toArray(); // tìm user theo id
  if (user.length !== 1) {
    res.status(404).json({ error: `No user with ID ${userId}` }); // nếu không tìm thấy user thì trả về thông báo lỗi
    return;
  }
  let newName = req.body.name; // lấy tên mới của user
  let newAvatarURL = req.body.avatarURL; // lấy avatar mới của user
  if (newName) {
    if (newName.length == 0) { // nếu tên rỗng thì đặt tên mới là id của user
      newName = userId;
    }
    await users.updateOne({ id: userId }, { $set: { name: newName } }); // cập nhật tên mới cho user theo id
  }
  if (newAvatarURL) {
    if (newAvatarURL.length === 0) { // nếu avatar rỗng thì đặt avatar mới là default.png
      newAvatarURL = "images/default.png";
    }
    await users.updateOne( // cập nhật avatar mới cho user theo id 
      { id: userId }, // cập nhật avatar mới cho user theo id
      { $set: { avatarURL: newAvatarURL } },
    );
  }
  user = await users.find({ id: userId }).toArray(); // tìm user theo id
  delete user[0]._id; // xóa _id
  res.json(user[0]);
});

// tạo bài viết mới
api.post("/users/:id/feed", async (req, res) => { 
  let userId = req.params.id; // lấy id của user 
  let user = await users.find({ id: userId }).toArray(); // tìm user theo id
  if (user.length !== 1) {
    res.status(404).json({ error: `No user with ID ${userId}` }); // nếu không tìm thấy user thì trả về thông báo lỗi
    return;
  }
  if (!req.body.text || req.body.text.length === 0) {
    res.status(400).json({ // nếu không có text hoặc text rỗng thì trả về thông báo lỗi
      error:
        "the request body is missing a text property or the textt is empty",
    });
    return;
  }
  await posts.insertOne({
    userId: userId, // id của user tạo bài viết mới
    time: new Date(), // thời gian hiện tại
    text: req.body.text,
  });
  res.json({ success: true });
});

// theo dõi user
api.post("/users/:id/follow", async (req, res) => {
  let userId = req.params.id; // lấy id của user 
  let user = await users.find({ id: userId }).toArray(); // tìm user theo id
  let targetId = req.query.target; // lấy id của user cần theo dõi 
  if (!targetId || targetId.length === 0) {
    res.status(400).json({ // nếu không có targetId hoặc targetId rỗng thì trả về thông báo lỗi
      error:
        "the query string is missing a target property, or the target is empty",
    });
    return;
  }
  let targetUser = await users.find({ id: targetId }).toArray(); // tìm user theo id 
  if (userId === targetId) { // nếu user và target giống nhau thì trả về thông báo lỗi
    res.status(400).json({ error: "user is the same as the target" });
    return;
  }
  if (user.length !== 1 || targetUser.length !== 1) { // nếu không tìm thấy user hoặc target thì trả về thông báo lỗi
    res.status(404).json({ error: "user id or target does not exist" });
    return;
  }
  let flag = false; // biến kiểm tra user đã theo dõi target chưa
  let following = user[0].following; // danh sách user đang theo dõi
  following.forEach((element) => { // duyệt qua từng user trong danh sách theo dõi
    if (element === targetId) { // nếu user đã theo dõi target thì đặt flag = true
      flag = true;
    }
  });

  if (flag) {
    res.status(400).json({ error: "user is already following the target" }); // nếu user đã theo dõi target thì trả về thông báo lỗi
    return;
  }

  following.push(targetId); // thêm target vào danh sách theo dõi
await users.updateOne({ id: userId }, { $set: { following: following } }); // cập nhật danh sách theo dõi cho user
  res.json({ success: true });
});

api.delete("/users/:id/follow", async (req, res) => { // hủy theo dõi user
  let userId = req.params.id; // lấy id của user
  let user = await users.find({ id: userId }).toArray(); // tìm user theo id
  let targetId = req.query.target; // lấy id của user cần hủy theo dõi
  if (!targetId || targetId.length === 0) {
    res.status(400).json({ // nếu không có targetId hoặc targetId rỗng thì trả về thông báo lỗi
      error:
        "the query string is missing a target property, or the target is empty",
    });
    return;
  }
  let targetUser = await users.find({ id: targetId }).toArray(); // tìm user theo id
  if (userId === targetId) {
    res.status(400).json({ error: "user is the same as the target" }); // nếu user và target giống nhau thì trả về thông báo lỗi
    return;
  }
  if (user.length !== 1 || targetUser.length !== 1) {
    res.status(404).json({ error: "user id or target does not exist" }); // nếu không tìm thấy user hoặc target thì trả về thông báo lỗi
    return;
  }
  let flag = false; // biến kiểm tra user đã theo dõi target chưa
  let following = user[0].following; // danh sách user đang theo dõi
  following.forEach((element) => { // duyệt qua từng user trong danh sách theo dõi
    if (element === targetId) { // nếu user đã theo dõi target thì đặt flag = true
      flag = true;
    }
  });

  if (!flag) {
    res.status(400).json({
      error: "target user isn't being followed by the requesting user", // nếu user chưa theo dõi target thì trả về thông báo lỗi
    });
    return;
  }

  following = following.filter((item) => item !== targetId); // loại bỏ target khỏi danh sách theo dõi
  await users.updateOne({ id: userId }, { $set: { following: following } }); // cập nhật danh sách theo dõi cho user
  res.json({ success: true });
});

/*** Test routes ***/

api.get("/tests/get", async (req, res) => {
  let value = req.query.value || null;
  res.json({ success: true, value });
});

api.post("/tests/post", (req, res) => {
  let value = req.body.value || null;
  res.json({ success: true, value });
});

api.get("/tests/error", (req, res) => {
  res.status(499).json({ error: "Test error" });
});

api.all("/tests/echo", (req, res) => {
  res.json({
    method: req.method,
    query: req.query,
    body: req.body,
  });
});

/*** Generic Social Media API ***/

//TODO: Add endpoints

/* Catch-all route to return a JSON error if endpoint not defined.
   Be sure to put all of your endpoints above this one, or they will not be called. */

api.all("/*", (req, res) => {
  res
    .status(404)
    .json({ error: `Endpoint not found: ${req.method} ${req.url}` });
});

export default initApi;