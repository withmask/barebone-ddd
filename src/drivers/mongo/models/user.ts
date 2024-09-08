import mongoose from 'mongoose';

export const mongooseUserSchema = new mongoose.Schema({
  _id: {
    type: mongoose.SchemaTypes.UUID,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: (str: string): boolean => /^[a-zA-Z0-9_]*$/.test(str),
      message: 'Username must be alphanumerical.'
    }
  },
  email: {
    type: String,
    required: true
  },
  validated: {
    type: Boolean,
    required: true
  },
  code: {
    type: String,
    required: false,
    default: undefined
  },
  password: {
    type: String,
    required: true
  }
} satisfies mongoose.SchemaDefinitionProperty);
