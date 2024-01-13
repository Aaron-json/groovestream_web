type UserInfo = {
  firstName: UserInfoField;
  lastName: UserInfoField;
  email: UserInfoField;
  dateOfBirth: UserInfoField;
  password: UserPasswordField;
};
type UserInfoField = {
  value: string;
  errMessage: string | undefined;
};

interface UserPasswordField extends UserInfoField {
  show: boolean;
}

type UserInfoUpdate = UserInfoErrorUpdate | UserInfoValueUpdate;

interface UserInfoErrorUpdate {
  type: "error";
  payload: {
    field: keyof UserInfo;
    errMessage: UserInfoField["errMessage"];
  };
}
interface UserInfoValueUpdate {
  type: keyof UserInfo;
  payload: string;
}
