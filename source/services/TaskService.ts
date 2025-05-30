
import { SoftObjectId } from "lib/mdweb/source/DB/MongoUtils";
import { ThrowIfNotValidObjectId } from "lib/mdweb/source/ErrorUtils/ThrowIf";
import { DB_TaskModel } from "source/models/TaskModel";

export class TaskService {
  static async GetTasksForUser(userId: SoftObjectId) {
    ThrowIfNotValidObjectId(userId);
    return await DB_TaskModel.find({ userId }).exec();
  }

  static async GetTaskWithId(taskId: SoftObjectId) {
    ThrowIfNotValidObjectId(taskId);
    return await DB_TaskModel.findById(taskId).exec();
  }
}