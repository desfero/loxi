export const unreachable = () => {
    throw new Error("Unreachable path");
};

export const isNonNullable = <T>(value: T): value is NonNullable<T> => {
    return value !== null && value !== undefined;
}
