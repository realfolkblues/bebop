
function addX(n, x) {
    return n + x;
}

function subX(n, x) {
    return n - x;
}

function increment(n) {
    return addX(n, 1);
}

// tree: name

export function name() {
    return 'example fn 1';
}

// tree: double, addX

export function double(n) {
    return addX(n, n);
}

// tree: triple, addX (x2)

export function triple(n) {
    return addX(n, addX(n, n));
}

// tree: doublePlusOne, double, addX, increment

export function doublePlusOne(n) {
    return increment(double(n));
}
