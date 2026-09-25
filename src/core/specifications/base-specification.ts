export abstract class BaseSpecification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: BaseSpecification<T>): BaseSpecification<T> {
    return new AndSpecification(this, other);
  }

  or(other: BaseSpecification<T>): BaseSpecification<T> {
    return new OrSpecification(this, other);
  }

  not(): BaseSpecification<T> {
    return new NotSpecification(this);
  }
}

class AndSpecification<T> extends BaseSpecification<T> {
  private readonly left: BaseSpecification<T>;
  private readonly right: BaseSpecification<T>;

  constructor(left: BaseSpecification<T>, right: BaseSpecification<T>) {
    super();
    this.left = left;
    this.right = right;
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && this.right.isSatisfiedBy(candidate);
  }
}

class OrSpecification<T> extends BaseSpecification<T> {
  private readonly left: BaseSpecification<T>;
  private readonly right: BaseSpecification<T>;

  constructor(left: BaseSpecification<T>, right: BaseSpecification<T>) {
    super();
    this.left = left;
    this.right = right;
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || this.right.isSatisfiedBy(candidate);
  }
}

class NotSpecification<T> extends BaseSpecification<T> {
  private readonly spec: BaseSpecification<T>;

  constructor(spec: BaseSpecification<T>) {
    super();
    this.spec = spec;
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

export class AlwaysTrueSpecification<T> extends BaseSpecification<T> {
  isSatisfiedBy(_candidate: T): boolean {
    return true;
  }
}

export class MessageContainsSpecification extends BaseSpecification<{
  message: string;
}> {
  private readonly substring: string;

  constructor(substring: string) {
    super();
    this.substring = substring.toLowerCase();
  }

  isSatisfiedBy(candidate: { message: string }): boolean {
    return candidate.message.toLowerCase().includes(this.substring);
  }
}

export class StatusCodeSpecification extends BaseSpecification<{
  statusCode?: number;
}> {
  private readonly minStatus: number;
  private readonly maxStatus: number;

  constructor(minStatus: number, maxStatus: number) {
    super();
    this.minStatus = minStatus;
    this.maxStatus = maxStatus;
  }

  isSatisfiedBy(candidate: { statusCode?: number }): boolean {
    if (candidate.statusCode === undefined) return false;
    return candidate.statusCode >= this.minStatus && candidate.statusCode <= this.maxStatus;
  }
}
