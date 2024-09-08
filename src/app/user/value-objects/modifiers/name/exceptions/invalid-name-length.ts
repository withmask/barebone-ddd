import { Exception } from "shared";

export class InvalidNameLengthException extends Exception<'validation'> {
  public constructor(
    public readonly rangeLength: [number,number],
    public readonly provided:number
  ) {
    super('validation')
  }
}