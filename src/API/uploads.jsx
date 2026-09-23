import { client } from "./client";

export const uploadsApi = {
  // Accepts an array of File objects, returns { urls: string[] }
  uploadImages: (files) => {
    const formData = new FormData();
    [...files].forEach((file) => formData.append("images", file));
    // Deliberately no Content-Type header here: axios auto-detects FormData
    // and sets "multipart/form-data; boundary=..." itself. Setting it
    // manually (without the boundary) makes the body unparseable on the
    // server and is what was causing upload requests to fail.
    return client.post("/uploads/images", formData).then((r) => r.data);
  },
};
