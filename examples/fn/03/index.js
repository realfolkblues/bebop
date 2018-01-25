function a() {
    function b() {
        console.log('letter b');
    }

    b();
}

function c() {
    function b() {
        console.log('another letter b');
    }

    b();
}

function d(fn) {
    fn();
    return fn;
}

const e = d(a);
const f = c;

e();
