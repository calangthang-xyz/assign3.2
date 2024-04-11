
let API_URL = "TODO";

API_URL = "/api";

if (window.API_URL) API_URL = window.API_URL;

export class HTTPError extends Error {

  constructor(status, message) {
   
    super(message);
    this.status = status;
  }
}


const apiRequest = async (method, path, body = null) => {
  let uri = API_URL + path;
  let url = "http://localhost:1930" + uri;
  let headers = {};

  if (body) {
    // Chuyển đối tượng body thành dạng chuỗi JSON.
    body = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  let response;
  try {
    // Thực hiện yêu cầu fetch tới server với URL và các thông số được chỉ định.
    response = await fetch(url, {
      method: method,
      headers: headers,
      body: body,
    });
  } catch (error) {
    // Ném ra lỗi nếu yêu cầu fetch thất bại.
    throw new Error("Failed to fetch data from the server");
  }

  // Kiểm tra nếu phản hồi không ổn (không phải là trạng thái 200).
  if (!response.ok) {
    // Lấy nội dung lỗi từ phản hồi json và ném lỗi HTTP.
    let data = await response.json();
    throw new HTTPError(response.status, data.error);
  }

  // Nếu mọi thứ ổn, trả về dữ liệu json.
  return await response.json();
};

// Xuất khẩu apiRequest để có thể sử dụng nó ở nơi khác trong ứng dụng.
export default apiRequest;