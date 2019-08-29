/*
 * Copyright (c) 2019, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Radio from '@material-ui/core/Radio';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import { makeStyles } from '@material-ui/core/styles';
import { FormattedMessage } from 'react-intl';
import CircularProgress from '@material-ui/core/CircularProgress';
import InputAdornment from '@material-ui/core/InputAdornment';

import APIValidation from 'AppData/APIValidation';
import API from 'AppData/api';
import DropZoneLocal from 'AppComponents/Shared/DropZoneLocal';

const useStyles = makeStyles(theme => ({
    mandatoryStar: {
        color: theme.palette.error.main,
    },
}));

/**
 * Sub component of API Create using OpenAPI UI, This is handling the taking input of WSDL file or URL from the user
 * In the create API using OpenAPI wizard first step out of 2 steps
 * @export
 * @param {*} props
 * @returns {React.Component} @inheritdoc
 */
export default function ProvideOpenAPI(props) {
    const { apiInputs, inputsDispatcher, onValidate } = props;
    const isFileInput = apiInputs.inputType === 'file';
    const classes = useStyles();
    const [isError, setValidity] = useState(); // If valid value is `null` else an error object will be there
    const [isValidating, setIsValidating] = useState(false);
    /**
     *
     *
     * @param {*} files
     */
    function onDrop(files) {
        // Why `files[0]` below is , We only handle one OpenAPI file at a time,
        // So if use provide multiple, We would only
        // accept the first file. This information is shown in the dropdown helper text
        inputsDispatcher({ action: 'inputValue', value: [files[0]] });
    }

    /**
     * Trigger the provided onValidate call back on each input validation run
     * Do the validation state aggregation and call the onValidate method with aggregated value
     * @param {Object} state Validation state object
     */
    function validate(state) {
        if (state === null) {
            setIsValidating(true);
            API.validateOpenAPIByUrl(apiInputs.inputValue).then((response) => {
                const {
                    body: { isValid, info },
                } = response;
                if (isValid) {
                    inputsDispatcher({ action: 'preSetAPI', value: info });
                    setValidity(null);
                } else {
                    setValidity({ message: 'OpenAPI content validation failed!' });
                }
                onValidate(isValid);
                setIsValidating(false);
            });
            // Valid URL string
            // TODO: Handle catch network or api call failures ~tmkb
        } else {
            setValidity(state);
            onValidate(false);
        }
    }
    return (
        <React.Fragment>
            <Grid container spacing={5}>
                <Grid item md={12}>
                    <FormControl component='fieldset'>
                        <FormLabel component='legend'>
                            <React.Fragment>
                                <sup className={classes.mandatoryStar}>*</sup>{' '}
                                <FormattedMessage
                                    id='Apis.Create.OpenAPI.Steps.ProvideOpenAPI.Input.type'
                                    defaultMessage='Input type'
                                />
                            </React.Fragment>
                        </FormLabel>
                        <RadioGroup
                            aria-label='Input type'
                            value={apiInputs.inputType}
                            onChange={event => inputsDispatcher({ action: 'inputType', value: event.target.value })}
                        >
                            <FormControlLabel value='url' control={<Radio />} label='OpenAPI URL' />
                            <FormControlLabel value='file' control={<Radio />} label='OpenAPI File' />
                        </RadioGroup>
                    </FormControl>
                </Grid>
                <Grid item md={7}>
                    {isFileInput ? (
                        // TODO: Pass message saying accepting only one file ~tmkb
                        <DropZoneLocal onDrop={onDrop} files={apiInputs.inputValue} />
                    ) : (
                        <TextField
                            autoFocus
                            id='outlined-full-width'
                            label='OpenAPI URL'
                            placeholder='Enter OpenAPI URL'
                            fullWidth
                            margin='normal'
                            variant='outlined'
                            onChange={({ target: { value } }) => inputsDispatcher({ action: 'inputValue', value })}
                            value={apiInputs.inputValue}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            InputProps={{
                                onBlur: ({ target: { value } }) => {
                                    validate(APIValidation.url.required().validate(value).error);
                                },
                                endAdornment: isValidating && (
                                    <InputAdornment position='end'>
                                        <CircularProgress />
                                    </InputAdornment>
                                ),
                            }}
                            // 'Give the URL of OpenAPI endpoint'
                            helperText={isError && isError.message}
                            error={Boolean(isError)}
                            disabled={isValidating}
                        />
                    )}
                </Grid>
            </Grid>
        </React.Fragment>
    );
}

ProvideOpenAPI.defaultProps = {
    onValidate: () => {},
};
ProvideOpenAPI.propTypes = {
    apiInputs: PropTypes.shape({
        type: PropTypes.string,
        inputType: PropTypes.string,
    }).isRequired,
    inputsDispatcher: PropTypes.func.isRequired,
    onValidate: PropTypes.func,
};
