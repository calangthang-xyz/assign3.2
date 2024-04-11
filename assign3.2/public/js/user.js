import apiRequest from "./apirequest.js";

// Lớp Post để định nghĩa một bài đăng bao gồm người dùng, thời gian và nội dung
export class Post {
  
  // Hàm khởi tạo cho lớp Post
  constructor(data) {
    // Lấy thông tin người dùng từ đối tượng data và chuyển đổi thành thực thể User
    this.user = new User(data.user);
    // Chuyển đổi thời gian từ data thành đối tượng Date trong JavaScript
    this.time = new Date(data.time);
    // Nội dung của bài đăng
    this.text = data.text;
  }
}

// Lớp User để định nghĩa một người dùng
export default class User {
  
  // Phương thức tĩnh để lấy danh sách tất cả người dùng
  static async listUsers() {
    let data = await apiRequest("GET", "/users");
    console.log(data);
    return data.users;
  }

  // Phương thức tĩnh để tải hoặc tạo người dùng dựa trên id
  static async loadOrCreate(id) {
    let users = await User.listUsers();
    let data = null;
    if (
      users.some((x) => {
        return x === id;
      })
    ) {
      data = await apiRequest("GET", "/users/" + id);
      console.log(data);
    } else {
      // Tạo user mới nếu user với id được cung cấp không tồn tại
      data = await apiRequest("POST", "/users", { id: id });
    }
    return new User(data);
  }

  // Hàm khởi tạo cho lớp User
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.avatarURL = data.avatarURL;
    this.following = data.following;
  }

  // Phương thức chuyển đối tượng user thành chuỗi
  toString() {
    return this.name;
  }

  // Phương thức chuyển đối tượng user thành định dạng JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      avatarURL: this.avatarURL,
    };
  }

  // Phương thức lưu thông tin của người dùng
  async save() {
    await apiRequest("PATCH", "/users/" + this.id, this);
  }

  // Lấy bảng tin của người dùng
  async getFeed() {
    let res = [];
    let data = await apiRequest("GET", "/users/" + this.id + "/posts");
    for (let post of data.posts) {
      res.push(new Post(post));
    }
    return res;
  }

  // Đăng một bài viết mới
  async makePost(text) {
    await apiRequest("POST", "/users/" + this.id + "/feed", { text: text });
  }

  // Thêm một người dùng khác vào danh sách người theo dõi
  async addFollow(id) {
    await apiRequest("POST", "/users/" + this.id + "/follow?target=" + id);
  }

  // Xóa bỏ một người dùng khác khỏi danh sách người theo dõi
  async deleteFollow(id) {
    await apiRequest("DELETE", "/users/" + this.id + "/follow?target=" + id);
  }
}

// Gán lớp User vào đối tượng window để có thể truy cập từ global scope trong trình duyệt
window.User = User;