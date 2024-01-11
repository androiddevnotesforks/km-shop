import * as React from 'react';
import {useContext} from 'react';
import {Box, Button, FormControlLabel, FormGroup, MenuItem, Stack, Switch, TextField} from "@mui/material";
import {useParams} from "react-router";
import {AlertError, AlertSuccess, AppCard, MultipleFiles, SnackbarError} from "../../components";
import {FolderOutlined} from "@mui/icons-material";
import {AppHelper, HttpClient, NavigateContext, Requests, useEffectTimout} from "../../base";
import {FileDialog} from "../../components/dialogs/FileDialog";
import {FileDeleteDialog} from "../../components/dialogs/FileDeleteDialog";
import {NotFoundPage} from "../error/NotFoundPage";
import {Formik} from "formik";
import * as Yup from "yup";
import {ImageTextField} from "../../components/fields/ImageTextField";
import {ProductSetValueFormic} from "./elements/ProductSetValueFormic";
import {CollectionsTextField} from "./elements/CollectionsTextField";

export function ProductUpdatePage() {

    let {id} = useParams();
    const categoriesItems = []

    // navigate app
    const {route, routes} = useContext(NavigateContext)

    const [modelId, setModelId] = React.useState(id ? parseInt(id) : null);
    const [data, setData] = React.useState(null);
    const [dataCategory, setDataCategory] = React.useState([]);
    const [dataCollections, setDataCollections] = React.useState([]);
    const [refresh, setRefresh] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [errorFile, setErrorFile] = React.useState(null);
    const [errorCode, setErrorCode] = React.useState(200);
    const [loading, setLoading] = React.useState(id !== undefined);
    const [showFile, setShowFile] = React.useState(null);
    const [deleteFile, setDeleteFile] = React.useState(null);
    const [deleteFilePositive, setDeleteFilePositive] = React.useState(null);

    // load
    useEffectTimout('ProductUpdatePage',async () => {
        if (Boolean(modelId)) {
            try {
                const product = await HttpClient.get.product(modelId)
                const categories = await HttpClient.get.categoriesPublished()
                const collections = await HttpClient.get.collections()

                setData(product)
                setDataCategory(categories.toArray())
                setDataCollections(collections.toArray().map((it) => ({
                    value: it.id,
                    name: it.name,
                    icon: it.icon,
                })))
                setLoading(false)

            } catch (error) {
                route.logout(error)
                setErrorCode(error.code)
                setError(error.message)
                setLoading(false)
            }
        }
    }, [modelId, refresh], () => {
        if (Boolean(modelId)) {
            setError(null)
            setErrorFile(null)
            setLoading(true)
        }
    })

    dataCategory.forEach((item) => {
        categoriesItems.push((
            <MenuItem
                key={`categories-item-${item.id}`}
                value={item.id}
            >
                {item.name}
            </MenuItem>
        ))
    })

    return (
        <>
            <SnackbarError
                error={error}
                onClose={() => {
                    setError(null)
                }}
            />

            <FileDialog
                url={showFile}
                onClose={() => {
                    setShowFile(null)
                }}
            />

            <FileDeleteDialog
                open={Boolean(deleteFile)}
                onNegative={() => {
                    setDeleteFile(null)
                }}
                onPositive={() => {
                    setDeleteFilePositive(deleteFile)
                    setDeleteFile(null)
                }}
            />

            {errorCode !== 200 ? (
                <NotFoundPage/>
            ) : (
                <Stack>

                    <AppCard
                        disabled={loading}
                        onRefresh={Boolean(modelId) || loading ? () => {
                            setRefresh(!refresh)
                        } : null}
                        icon={FolderOutlined}
                        color={'secondary.dark'}
                        variant={'combine'}
                        title={`${Boolean(modelId) ? 'Edit' : 'Create'} Product`}
                        subheader={Boolean(modelId) ? 'Here you can edit the product' : 'Here you can create a new product'}
                    >
                        <Box sx={{
                            paddingTop: 1,
                            paddingBottom: 3
                        }}>
                            <Formik
                                initialValues={{
                                    categoryID: '',
                                    image1: '',
                                    image2: '',
                                    image3: '',
                                    name: '',
                                    description: '',
                                    price: 0,
                                    isPublished: false,
                                    uploads: [],
                                    collections: [],
                                    submit: null
                                }}
                                validationSchema={Yup.object().shape({
                                    categoryID: Yup
                                        .number()
                                        .required('Category is required')
                                        .positive('Category is required'),
                                    image1: Yup.string().required('Image is required'),
                                    name: Yup.string()
                                        .required('Name is required')
                                        .min(3, 'Size must be between 3 and 255')
                                        .max(255, 'Size must be between 3 and 255'),
                                    description: Yup.string()
                                        .required('Description is required')
                                        .min(3, 'Size must be between 3 and 1000')
                                        .max(1000, 'Size must be between 3 and 1000'),
                                    price: Yup.number()
                                        .required('Price is required')
                                        .positive('Price must be a positive number')
                                })}
                                onSubmit={async (values, {setErrors, setStatus}) => {

                                    setLoading(true)
                                    setErrorFile(null)
                                    setStatus({success: null});
                                    setErrors({submit: null});

                                    await new Promise(r => setTimeout(r, 1000));

                                    try {

                                        const response = Boolean(modelId) ? (
                                            await HttpClient.put.product(modelId, new Requests.ProductRequest(
                                                values.categoryID,
                                                values.image1,
                                                values.image2,
                                                values.image3,
                                                values.name,
                                                values.description,
                                                values.price,
                                                values.isPublished,
                                                values.collections,
                                                values.uploads,
                                            ))
                                        ) : (
                                            await HttpClient.post.product(new Requests.ProductRequest(
                                                values.categoryID,
                                                values.image1,
                                                values.image2,
                                                values.image3,
                                                values.name,
                                                values.description,
                                                values.price,
                                                values.isPublished,
                                                values.collections,
                                                values.uploads,
                                            ))
                                        )

                                        if (!Boolean(modelId)) {
                                            setModelId(response.id)
                                            route.toLocationPush(routes.productEdit, response.id)
                                        }

                                        setStatus({success: true});
                                        setLoading(false);

                                    } catch (error) {

                                        route.logout(error)

                                        const errors = {
                                            categoryID: AppHelper.findError('categoryID', error.validate),
                                            image1: AppHelper.findError('image1', error.validate),
                                            image2: AppHelper.findError('image2', error.validate),
                                            image3: AppHelper.findError('image3', error.validate),
                                            name: AppHelper.findError('name', error.validate),
                                            description: AppHelper.findError('description', error.validate),
                                            price: AppHelper.findError('price', error.validate),
                                        }

                                        setErrors(AppHelper.isNotEmpty(errors) ? errors : {
                                            submit: error.message
                                        });

                                        setStatus({success: false});
                                        setLoading(false);
                                    }
                                }}
                            >
                                {({
                                      status,
                                      errors,
                                      handleBlur,
                                      handleChange,
                                      handleSubmit,
                                      touched,
                                      values,
                                      setFieldValue
                                  }) => (
                                    <form noValidate onSubmit={handleSubmit}>

                                        <ProductSetValueFormic
                                            data={data}
                                            refresh={refresh}
                                            removeRelation={deleteFilePositive}
                                        />

                                        {errors.submit && (
                                            <AlertError>
                                                {errors.submit}
                                            </AlertError>
                                        )}

                                        {status && status.success && (
                                            <AlertSuccess>
                                                Success submit form!
                                            </AlertSuccess>
                                        )}

                                        <FormGroup>
                                            <Stack spacing={2}>

                                                <MultipleFiles
                                                    error={errorFile}
                                                    disabled={loading}
                                                    values={values.uploads}
                                                    onUpload={async (uploads) => {
                                                        // clear state file upload
                                                        setErrorFile(null)
                                                        setLoading(true)
                                                        // create requests
                                                        const requests = await AppHelper.convertUploads(uploads)
                                                        // request
                                                        try {
                                                            const response = await HttpClient
                                                                .post
                                                                .uploads(requests)

                                                            setFieldValue('uploads', response
                                                                .toArray()
                                                                .reverse()
.map((it) => AppHelper.getFileUrl(it.fileName))
                                                                .concat(values.uploads)
                                                            )

                                                            setLoading(false)
                                                        } catch (error) {
                                                            setLoading(false)
                                                            setErrorFile(error.message)
                                                        }
                                                    }}
                                                    onClickChip={(url) => {
                                                        setShowFile(url)
                                                    }}
                                                    onDeleteChip={(url) => {
                                                        setDeleteFile((url))
                                                    }}
                                                />

                                                <ImageTextField
                                                    disabled={loading}
                                                    type={'url'}
                                                    name={'image1'}
                                                    value={values.image1}
                                                    helperText={touched.image1 ? errors.image1 : ''}
                                                    error={Boolean(touched.image1 && errors.image1)}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    label="Main Image Url"
                                                    variant="filled"
                                                    onClickImage={() => {
                                                        setShowFile(values.image1)
                                                    }}
                                                />

                                                <ImageTextField
                                                    disabled={loading}
                                                    type={'url'}
                                                    name={'image2'}
                                                    value={values.image2}
                                                    helperText={touched.image2 ? errors.image2 : ''}
                                                    error={Boolean(touched.image2 && errors.image2)}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    label="Second Image Url"
                                                    variant="filled"
                                                    onClickImage={() => {
                                                        setShowFile(values.image2)
                                                    }}
                                                />

                                                <ImageTextField
                                                    disabled={loading}
                                                    type={'url'}
                                                    name={'image3'}
                                                    value={values.image3}
                                                    helperText={touched.image3 ? errors.image3 : ''}
                                                    error={Boolean(touched.image3 && errors.image3)}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    label="Third Image Url"
                                                    variant="filled"
                                                    onClickImage={() => {
                                                        setShowFile(values.image3)
                                                    }}
                                                />

                                                <TextField
                                                    disabled={loading}
                                                    type={'text'}
                                                    name={'categoryID'}
                                                    value={values.categoryID}
                                                    helperText={touched.categoryID ? errors.categoryID : ''}
                                                    error={Boolean(touched.categoryID && errors.categoryID)}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    select
                                                    fullWidth
                                                    label='Category'
                                                    variant="filled"
                                                >
                                                    {categoriesItems}
                                                </TextField>

                                                <CollectionsTextField
                                                    disabled={loading}
                                                    rows={dataCollections}
                                                    selects={values.collections}
                                                    onChange={(ids) => setFieldValue('collections', ids)}
                                                />

                                                <TextField
                                                    disabled={loading}
                                                    type={'text'}
                                                    name={'name'}
                                                    value={values.name}
                                                    helperText={touched.name ? errors.name : ''}
                                                    error={Boolean(touched.name && errors.name)}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    label="Name"
                                                    variant="filled"
                                                />

                                                <TextField
                                                    disabled={loading}
                                                    type={'text'}
                                                    name={'price'}
                                                    value={values.price}
                                                    helperText={touched.price ? errors.price : ''}
                                                    error={Boolean(touched.price && errors.price)}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    label="Price"
                                                    variant="filled"
                                                />

                                                <TextField
                                                    disabled={loading}
                                                    type={'text'}
                                                    name={'description'}
                                                    value={values.description}
                                                    helperText={touched.description ? errors.description : ''}
                                                    error={Boolean(touched.description && errors.description)}
                                                    onBlur={handleBlur}
                                                    onChange={handleChange}
                                                    fullWidth
                                                    multiline
                                                    minRows={4}
                                                    maxRows={10}
                                                    label="Description"
                                                    variant="filled"
                                                />

                                                <FormControlLabel
                                                    sx={{
                                                        color: errors.isPublished ? '#d32f2f' : 'auto'
                                                    }}
                                                    control={<Switch
                                                        disabled={loading}
                                                        checked={values.isPublished}
                                                        onChange={(event, checked) => setFieldValue('isPublished', checked)}
                                                    />}
                                                    label={"Product published" + (errors.isPublished ? ` (${errors.isPublished})` : '')}
                                                />

                                                <Stack
                                                    alignItems="flex-end"
                                                >
                                                    <Button
                                                        disableElevation
                                                        sx={{color: 'white', paddingTop: '10px'}}
                                                        variant={'contained'}
                                                        color={'secondary'}
                                                        disabled={loading}
                                                        type={'submit'}
                                                        size={'large'}
                                                        onClick={() => {
                                                            route.scrollToTop()
                                                        }}
                                                    >
                                                        {Boolean(modelId) ? 'Update' : 'Add'}
                                                    </Button>
                                                </Stack>


                                            </Stack>
                                        </FormGroup>
                                    </form>
                                )}
                            </Formik>
                        </Box>
                    </AppCard>
                </Stack>
            )}
        </>
    );
}

ProductUpdatePage.propTypes = {};
