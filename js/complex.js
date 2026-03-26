(function (global) {
  class Complex {
    constructor(re, im) {
      this.re = re || 0;
      this.im = im || 0;
    }

    add(b) {
      return new Complex(this.re + b.re, this.im + b.im);
    }

    sub(b) {
      return new Complex(this.re - b.re, this.im - b.im);
    }

    mul(b) {
      return new Complex(
        this.re * b.re - this.im * b.im,
        this.re * b.im + this.im * b.re
      );
    }

    div(b) {
      const denominator = b.re ** 2 + b.im ** 2;
      if (denominator === 0) return null;
      return new Complex(
        (this.re * b.re + this.im * b.im) / denominator,
        (this.im * b.re - this.re * b.im) / denominator
      );
    }

    mod() {
      return Math.sqrt(this.re ** 2 + this.im ** 2);
    }

    arg() {
      return Math.atan2(this.im, this.re);
    }

    conj() {
      return new Complex(this.re, -this.im);
    }
  }

  global.ComplexMath = {
    Complex
  };
})(window);
