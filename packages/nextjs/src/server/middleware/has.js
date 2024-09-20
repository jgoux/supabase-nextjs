export function createHas(user) {
    return function has(userProps) {
        return partiallyMatch(userProps, user);
    };
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
function partiallyMatch(partial, full) {
    if (partial === full)
        return true;
    if (typeof partial !== "object" || partial === null || full === null)
        return false;
    if (Array.isArray(partial)) {
        return (Array.isArray(full) &&
            partial.every((item) => full.some((elem) => partiallyMatch(item, elem))));
    }
    for (const key in partial) {
        if (!(key in full) || !partiallyMatch(partial[key], full[key])) {
            return false;
        }
    }
    return true;
}
//# sourceMappingURL=has.js.map