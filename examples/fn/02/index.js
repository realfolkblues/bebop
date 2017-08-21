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

    return b;
}

const d = c();

d();
