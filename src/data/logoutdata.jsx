import crud from "../services/crudInstance";
import API from "../services/api";
import ServerError from "../utils/ServerError";

const logout = async () => {
  const res = await crud.post(API.AUTH.LOGOUT, {});

  if (!res || res.success === false) {
    throw new ServerError("Logout failed", res?.status, res);
  }

  return true;
};

export default { logout };
