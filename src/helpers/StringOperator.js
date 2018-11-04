class StringOperator {

  static checksum(str) {
    let hash = 0;
    if (str.length === 0) {
      return hash;
    }

    for (let index = 0; index < str.length; index++) {
      const chr = str.charCodeAt(index);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0;
    }

    return hash.toString();
  }

}

exports.StringOperator = StringOperator;
