// import apiRequest from "./apirequest.js";
import FollowList from "./followlist.js";
import User, { Post } from "./user.js";

export default class App {
  constructor() {
    /* Lưu trữ người dùng đang đăng nhập. */
    this._user = null;

    this._onListUsers = this._onListUsers.bind(this);
    this._onLogin = this._onLogin.bind(this);
    this._loginForm = document.querySelector("#loginForm");
    this._loginForm.listUsers.addEventListener("click", this._onListUsers);
    this._loginForm.login.addEventListener("click", this._onLogin);
    //TODO: Khởi tạo bất kỳ biến/handler riêng và thiết lập FollowList
    this._postForm = document.querySelector("#postForm");
    this._onPost = this._onPost.bind(this);
    this._postForm
      .querySelector("#postButton")
      .addEventListener("click", this._onPost);
    this._onAddFollower = this._onAddFollower.bind(this);
    this._onRemoveFollower = this._onRemoveFollower.bind(this);
    this._followList = new FollowList(
      document.querySelector("#followContainer"),
      this._onAddFollower,
      this._onRemoveFollower,
    );

    this._onAvatarSubmit = this._onAvatarSubmit.bind(this);
    this._onNameSubmit = this._onNameSubmit.bind(this);
  }

  /*** Các hàm xử lý sự kiện ***/

  // Xử lý sự kiện khi nút "List Users" được click
  async _onListUsers() {
    let users = await User.listUsers();
    let usersStr = users.join("\n");
    alert(`Danh sách người dùng:\n\n${usersStr}`);
  }

  // Xử lý sự kiện khi nút đăng nhập được click
  async _onLogin(event) {
    event.preventDefault(); // Ngăn chặn load lại trang sau khi đăng nhập
    this._user = await User.loadOrCreate(this._loginForm.userid.value);
    await this._loadProfile();
    let postArray = await this._user.getFeed();
    for (let i of postArray) {
      this._displayPost(i);
    }
  }

  // Xử lý sự kiện khi nút đăng bài viết được click
  async _onPost(event) {
    event.preventDefault();
    let text = this._postForm.querySelector("#postText").value;
    await this._user.makePost(text);
    await this._loadProfile();
    let postArray = await this._user.getFeed();
    for (let i of postArray) {
      this._displayPost(i);
    }
  }

  // Xử lý sự kiện khi người theo dõi bị xóa
  async _onRemoveFollower(id) {
    await this._user.deleteFollow(id);
    await this._loadProfile();
    let postArray = await this._user.getFeed();
    for (let i of postArray) {
      this._displayPost(i);
    }
  }

  // Xử lý sự kiện khi thêm người theo dõi
  async _onAddFollower(id) {
    await this._user.addFollow(id);
    await this._loadProfile();
    let postArray = await this._user.getFeed();
    for (let i of postArray) {
      this._displayPost(i);
    }
  }

  // Xử lý sự kiện khi tên người dùng được gửi đi
  async _onNameSubmit(event) {
    event.preventDefault();
    this._user.name = document.querySelector("#nameInput").value;
    await this._user.save();
    await this._loadProfile();
    let postArray = await this._user.getFeed();
    for (let i of postArray) {
      this._displayPost(i);
    }
  }

  // Xử lý sự kiện khi avatar của người dùng được gửi đi
  async _onAvatarSubmit(event) {
    event.preventDefault();
    this._user.avatarURL = document.querySelector("#avatarInput").value;
    await this._user.save();
    await this._loadProfile();
    let postArray = await this._user.getFeed();
    for (let i of postArray) {
      this._displayPost(i);
    }
  }

 

  /* Thêm đối tượng Post đã cho vào feed. */
  _displayPost(post) {
    /* Đảm bảo rằng chúng ta nhận được một đối tượng Post. */
    if (!(post instanceof Post)) {
      throw new Error("displayPost không nhận được một đối tượng Post");
    }

    let elem = document.querySelector("#templatePost").cloneNode(true);
    elem.id = "";

    let avatar = elem.querySelector(".avatar");
    avatar.src = post.user.avatarURL;
    avatar.alt = `${post.user}'s avatar`;

    elem.querySelector(".name").textContent = post.user;
    elem.querySelector(".userid").textContent = post.user.id;
    elem.querySelector(".time").textContent = post.time.toLocaleString();
    elem.querySelector(".text").textContent = post.text;

    document.querySelector("#feed").append(elem);
  }

  /* Tải (hoặc tải lại) hồ sơ của người dùng. Giả định rằng this._user đã được thiết lập thành một thể hiện của User. */
  async _loadProfile() {
    document.querySelector("#welcome").classList.add("hidden");
    document.querySelector("#main").classList.remove("hidden");
    document.querySelector("#idContainer").textContent = this._user.id;
    /* Đặt lại feed. */
    document.querySelector("#feed").textContent = "";

    /* Cập nhật avatar, tên và ID người dùng trong biểu mẫu đăng bài viết mới */
    this._postForm.querySelector(".avatar").src = this._user.avatarURL;
    this._postForm.querySelector(".name").textContent = this._user;
    this._postForm.querySelector(".userid").textContent = this._user.id;

    //TODO: Cập nhật phần còn lại của sidebar và hiển thị feed của người dùng
    document.querySelector("#nameInput").value = this._user.name;
    document.querySelector("#avatarInput").value = this._user.avatarURL;
    document
      .querySelector("#nameSubmit")
      .addEventListener("click", this._onNameSubmit);
    document
      .querySelector("#avatarSubmit")
      .addEventListener("click", this._onAvatarSubmit);
    this._followList.setList(this._user.following);
  }
}
