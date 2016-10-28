$(function () {
    function dataURItoJSON(dataURI) {
        // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return {'buffer': ia, 'mimetype': mimeString};
    }

    var featuredImage = $('#main');
    var otherImage1 = $('#other1');
    var otherImage2 = $('#other2');
    var compressedFeatured = $('#compressedFeatured');
    var compressedOther1 = $('#compressedOther1');
    var compressedOther2 = $('#compressedOther2');
    var compressedFeaturedPrev = $('#compressedFeaturedPrev');
    var compressedOther1Prev = $('#compressedOther1Prev');
    var compressedOther2Prev = $('#compressedOther2Prev');

    featuredImage.change(function () {
        if (this.files[0]) {
            console.log(this.files[0]);
            console.log(this.files[0].size);
            console.log("Filename:" + this.files[0].name);
            console.log("Filesize:" + (parseInt(this.files[0].size) / 1024) + " Kb");
            console.log("Type:" + this.files[0].type);
            compressedFeaturedPrev.empty();
            var reader = new FileReader();
            reader.onload = function (e) {
                var img = document.createElement("img");
                img.src = e.target.result;
                var newImg = jic.compress(img, 50, "jpg");
                newImg.classList.add("img-responsive");
                compressedFeaturedPrev.append(newImg);
                var newJSON = dataURItoJSON(newImg.src);
                compressedFeatured.attr('value', newJSON);
            };
            reader.onerror = function (e) {
                console.log("Error: " + e);
            };
            reader.readAsDataURL(this.files[0]);
        } else {
            compressedFeaturedPrev.empty();
            compressedFeatured.attr('value', '');
        }
    });
});
