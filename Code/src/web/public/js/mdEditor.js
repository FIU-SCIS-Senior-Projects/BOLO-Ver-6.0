window.onload = function () {
    var converter = new showdown.Converter();
    var textInputBox = document.getElementsByName('in')[0];
    var markdownArea = document.getElementById('markdown');

    var convertTextAreaToMarkdown = function () {
        console.log(textInputBox.value);
        var markdownText = textInputBox.value;
        markdownArea.innerHTML = converter.makeHtml(markdownText)
    };

    textInputBox.addEventListener('input', convertTextAreaToMarkdown);

    convertTextAreaToMarkdown();
};