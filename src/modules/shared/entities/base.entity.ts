export abstract class BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;
  public readonly createdBy?: string;
  public readonly updatedBy?: string;
  public readonly active: boolean;

  protected constructor(props: {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
    createdBy?: string;
    updatedBy?: string;
    active?: boolean;
  }) {
    this.id = props.id;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? new Date();
    this.createdBy = props.createdBy;
    this.updatedBy = props.updatedBy;
    this.active = props.active ?? true;
  }
}
