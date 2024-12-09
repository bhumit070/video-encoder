import axios from "axios";

export const apiV1Client = axios.create({
  baseURL: `http://localhost:8080/api/v1/`,
});

export const APIS = {
  v1: {
    GET_VIDEOS: `file/videos`,
    UPLOAD_VIDEO: `file/upload`,
  },
};
