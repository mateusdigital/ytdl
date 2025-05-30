import { SoftObjectId } from "lib/mdweb/source/DB/MongoUtils";
import { ThrowIfEmptyOrNull, ThrowIfNotValidObjectId } from "lib/mdweb/source/ErrorUtils/ThrowIf";
import { Logger } from "lib/mdweb/source/Logger";
import { DB_UserModel } from "source/models/UserModel";

export class UserService {
  static CreateUser(username: string) {
    ThrowIfEmptyOrNull(username, "Username cannot be empty");

    try {
      const user = new DB_UserModel({ username });
      return user.save();
    } catch (error) {
      Logger.Error("Error creating user:", error);
    }

    return null;
  }

  static GetUserWithUsername(username: string) {
    ThrowIfEmptyOrNull(username, "Username cannot be empty");

    try {
      return DB_UserModel.findOne({ username: username });
    } catch (error) {
      Logger.Error("Error fetching user with username:", error);
    }

    return null;
  }

  static async GetUserWithId(userId: SoftObjectId) {
    ThrowIfNotValidObjectId(userId);

    try {
      return await DB_UserModel.findById(userId);
    } catch (error) {
      Logger.Error("Error fetching user with ID:", error);
    }

    return null;
  }
}