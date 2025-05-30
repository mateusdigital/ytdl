// -----------------------------------------------------------------------------
import mongoose, { Schema, Document, Model } from 'mongoose';


//
// Schema
//

// -----------------------------------------------------------------------------
const ModelSchema = new Schema(
  // ---------------------------------------------------------------------------
  {
    // --- Housekeeping --------------------------------------------------------
    createdAt: { type: Date, default: () => new Date() },
    updatedAt: { type: Date, default: () => new Date() },
    createdBy: { type: String, required: true },

    // --- Config Information --------------------------------------------------
    version: { type: Number, required: true },
  },

  // ---------------------------------------------------------------------------
  {
    collection: 'Users',
    timestamps: true,
  }
);

// Model interface for TypeScript
interface IModel extends Document {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  version: number;
}

// Create the model from the schema
const DB_UserModel: Model<IModel> = mongoose.model<IModel>('User', ModelSchema);

export { DB_UserModel };
