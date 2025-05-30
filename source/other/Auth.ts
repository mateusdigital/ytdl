import { SoftObjectId } from "lib/mdweb/source/DB/MongoUtils";

type Auth = {
  authUserId: SoftObjectId;
  isAuthorized: boolean;
}

export function Authorize(req: any, res: any) {
  const { userId } = ((req.body) as any).userId;
  return {
    auth: {
      authUserId: userId,
      isAuthorized: true,
    }
  };
}
