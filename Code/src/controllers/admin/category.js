var Category = require('../../models/category');

/**
 * Error handling for MongoDB
 */
var getErrorMessage = function (err) {
    var message = [];
    for (var errName in err.errors) {
        if (err.errors[errName].message) {
            message.push({msg: err.errors[errName].message});
        }
    }
    return message;
};

exports.listCategories = function (req, res) {
    Category.findAllCategories(function (err, listOfCategories) {
        if (err) throw err;
        res.render('admin-category', {categories: listOfCategories})
    })
};

exports.getCategoryForm = function (req, res) {
    res.render('admin-category-create');
};

exports.getCategoryDetails = function (req, res) {
    Category.findCategoryByID(req.params.id, function (err, category) {

        if (err) {
            req.flash('error_msg', 'Could not get category details');
            res.redirect('/admin/category');
        } else {
            res.render('admin-category-details', {category: category});
        }

        if (err) throw err;
    });
};

exports.createNewCategory = function (req, res) {
    //Holds previously entered form data
    var prevForm = {
        name1: req.body.name
    };

    //Validation of form
    req.checkBody('name', 'A category name is required').notEmpty();
    req.checkBody('fields', 'Need At least one field to continue').notEmpty();
    var errors = req.validationErrors();

    //If at least one error was found
    if (errors) {
        console.log('Validation has failed');
        prevForm.errors = errors;
        res.render('admin-category-create', prevForm);
    }
    // If the form is valid
    else {
        var newCategory = new Category({
            name: req.body.name,
            fields: req.body.fields
        });
        //IF they are previewing then render the Preview
        if (req.body.option === "preview") {
            res.render('admin-category-preview', {category: newCategory});
        }
        //They are submitting and want to create a new category. A new category is created.
        else {
            Category.createCategory(newCategory, function (err, category) {
                if (err) {
                    console.log('Save Category has failed');
                    prevForm.errors = getErrorMessage(err);
                    res.render('admin-category-create', prevForm);
                } else {
                    req.flash('success_msg', 'Category ' + category.name + ' has been created');
                    res.redirect('/admin/category/create');
                }
            });
        }

    }
};

exports.getEditCategoryForm = function (req, res) {

    Category.findCategoryByID(req.params.id, function (err, category) {

        if (err) {
            req.flash('error_msg', 'Could not get category details');
            res.redirect('/admin/category');
        } else {
            res.render('admin-category-edit', {category: category});
        }

        if (err) throw err;
    });

};

exports.postEditCategory = function (req, res) {
    var prevForm = {
        name1: req.body.name
    };

    //Validation of form
    req.checkBody('name', 'A category name is required').notEmpty();
    req.checkBody('fields', 'Need At least one field to continue').notEmpty();
    var errors = req.validationErrors();

    //If at least one error was found
    if (errors) {
        console.log('Validation has failed');
        prevForm.errors = errors;
        res.render('admin-category-create', prevForm);
    }

    else {
        Category.findCategoryByID(req.params.id, function (err, category) {
            if (err) throw err;
            console.log("I FOUND THE CATEGORY");
            //Update the category
            if (req.body.name) category.name = req.body.name;
            if (req.body.fields) category.fields = req.body.fields;

            //IF they are previewing then render then Preview
            if (req.body.option === "preview") {
                res.render('admin-category-preview', {category: category});
            }
            //They are submitting and want to update the category. the category is saved.
            else {
                category.save(function (err) {
                    if (err) {
                        req.flash('error_msg', getErrorMessage(err)[0].msg);
                        res.redirect('/admin/category/edit/' + req.params.id);
                    } else {

                        req.flash('success_msg', 'Category has been Updated!');
                        res.redirect('/admin/category/');
                    }
                });
            }

        })
    }


};

exports.removeCategory = function (req, res) {

};