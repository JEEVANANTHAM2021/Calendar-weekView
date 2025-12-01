import { Schema, model, InferSchemaType, HydratedDocument } from 'mongoose';

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true }
  },
  { timestamps: true }
);

type UserAttrs = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserAttrs>;

export const UserModel = model<UserAttrs>('User', UserSchema);

export function toUserDTO(user: UserDocument) {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name
  };
}
