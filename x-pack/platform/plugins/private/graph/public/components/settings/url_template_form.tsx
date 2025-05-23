/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useEffect } from 'react';
import {
  EuiFormRow,
  EuiFieldText,
  EuiComboBox,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiLink,
  EuiAccordion,
  UseEuiTheme,
  useEuiTheme,
} from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { css } from '@emotion/react';
import { UrlTemplate } from '../../types';
import { outlinkEncoders } from '../../helpers/outlink_encoders';
import { urlTemplateIconChoices } from '../../helpers/style_choices';
import { isUrlTemplateValid, isKibanaUrl, replaceKibanaUrlParam } from '../../helpers/url_template';
import { isEqual } from '../helpers';
import { IconRenderer } from '../icon_renderer';
import { legacyIconStyles } from './legacy_icon.styles';

export interface NewFormProps {
  onSubmit: (template: UrlTemplate) => void;
  onRemove: () => void;
  id: string;
}

export interface UpdateFormProps {
  onSubmit: (template: UrlTemplate) => void;
  initialTemplate: UrlTemplate;
  onRemove: () => void;
  id: string;
}

export type UrlTemplateFormProps = NewFormProps | UpdateFormProps;

function isUpdateForm(props: UrlTemplateFormProps): props is UpdateFormProps {
  return 'initialTemplate' in props;
}

export function UrlTemplateForm(props: UrlTemplateFormProps) {
  const { onSubmit } = props;
  const getInitialTemplate = () =>
    isUpdateForm(props)
      ? props.initialTemplate
      : {
          encoder: outlinkEncoders[0],
          icon: null,
          description: '',
          url: '',
        };

  const [currentTemplate, setCurrentTemplate] = useState(getInitialTemplate);

  const euiThemeContext = useEuiTheme();

  const persistedTemplateState = isUpdateForm(props) && props.initialTemplate;

  // reset local form if template passed in from parent component changes
  useEffect(() => {
    if (isUpdateForm(props) && currentTemplate !== props.initialTemplate) {
      setCurrentTemplate(props.initialTemplate);
    }
    // this hook only updates on change of the prop
    // it's meant to reset the internal state on changes outside of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedTemplateState]);

  const [touched, setTouched] = useState({
    description: false,
    url: false,
  });

  const [open, setOpen] = useState(!isUpdateForm(props));

  const [autoformatUrl, setAutoformatUrl] = useState(false);

  function setValue<K extends keyof UrlTemplate>(key: K, value: UrlTemplate[K]) {
    setCurrentTemplate({ ...currentTemplate, [key]: value });
  }

  function reset() {
    setTouched({
      description: false,
      url: false,
    });
    setCurrentTemplate(getInitialTemplate());
    setAutoformatUrl(false);
  }

  function convertUrl() {
    setCurrentTemplate({
      ...currentTemplate,
      url: replaceKibanaUrlParam(currentTemplate.url),
      // reset to kql encoder
      encoder:
        currentTemplate.encoder.type === 'kql'
          ? currentTemplate.encoder
          : outlinkEncoders.find((enc) => enc.type === 'kql')!,
    });
    setAutoformatUrl(false);
  }

  const urlPlaceholderMissing = Boolean(
    currentTemplate.url && !isUrlTemplateValid(currentTemplate.url)
  );
  const formIncomplete = !Boolean(currentTemplate.description && currentTemplate.url);

  const formUntouched = isEqual(currentTemplate, getInitialTemplate());

  return (
    <EuiAccordion
      id={props.id}
      initialIsOpen={!isUpdateForm(props)}
      buttonContent={
        isUpdateForm(props)
          ? props.initialTemplate.description
          : i18n.translate('xpack.graph.templates.addLabel', {
              defaultMessage: 'New drilldown',
            })
      }
      extraAction={
        isUpdateForm(props) &&
        props.initialTemplate.icon && (
          <IconRenderer
            icon={props.initialTemplate.icon}
            css={[legacyIconStyles.base(euiThemeContext), legacyIconStyles.list(euiThemeContext)]}
          />
        )
      }
      css={[
        styles.listAccordion(euiThemeContext),
        open && styles.openListAccordion(euiThemeContext),
      ]}
      buttonProps={{ css: styles.button(euiThemeContext) }}
      onToggle={(isOpen) => {
        setOpen(isOpen);
      }}
      paddingSize="m"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(currentTemplate);
          if (!isUpdateForm(props)) {
            reset();
          }
        }}
      >
        <EuiFormRow
          fullWidth
          label={i18n.translate('xpack.graph.settings.drillDowns.urlDescriptionInputLabel', {
            defaultMessage: 'Title',
          })}
          isInvalid={touched.description && !currentTemplate.description}
          onBlur={() => setTouched({ ...touched, description: true })}
        >
          <EuiFieldText
            fullWidth
            value={currentTemplate.description}
            isInvalid={touched.description && !currentTemplate.description}
            onChange={(e) => setValue('description', e.target.value)}
            placeholder={i18n.translate(
              'xpack.graph.settings.drillDowns.urlDescriptionInputPlaceholder',
              { defaultMessage: 'Search on Google' }
            )}
          />
        </EuiFormRow>
        <EuiFormRow
          fullWidth
          label={i18n.translate('xpack.graph.settings.drillDowns.urlInputLabel', {
            defaultMessage: 'URL',
          })}
          helpText={
            <>
              {autoformatUrl && (
                <p>
                  <strong>
                    {i18n.translate('xpack.graph.settings.drillDowns.kibanaUrlWarningText', {
                      defaultMessage: 'Possible Kibana URL pasted, ',
                    })}
                    <EuiLink onClick={convertUrl}>
                      <strong>
                        {i18n.translate(
                          'xpack.graph.settings.drillDowns.kibanaUrlWarningConvertOptionLinkText',
                          { defaultMessage: 'convert it.' }
                        )}
                      </strong>
                    </EuiLink>
                  </strong>
                </p>
              )}
              {i18n.translate('xpack.graph.settings.drillDowns.urlInputHelpText', {
                defaultMessage:
                  'Define template URLs using {gquery} where the selected vertex terms are inserted.',
                values: { gquery: '{{gquery}}' },
              })}
            </>
          }
          onBlur={() => setTouched({ ...touched, url: true })}
          isInvalid={urlPlaceholderMissing || (touched.url && !currentTemplate.url)}
          error={
            urlPlaceholderMissing
              ? [
                  i18n.translate('xpack.graph.settings.drillDowns.invalidUrlWarningText', {
                    defaultMessage: 'The URL must contain a {placeholder} string.',
                    values: { placeholder: '{{gquery}}' },
                  }),
                ]
              : []
          }
        >
          <EuiFieldText
            fullWidth
            placeholder="https://www.google.co.uk/#q={{gquery}}"
            value={currentTemplate.url}
            onChange={(e) => {
              setValue('url', e.target.value);
              if (
                (e.nativeEvent as InputEvent)?.inputType !== 'insertFromPaste' ||
                !isKibanaUrl(e.target.value)
              ) {
                setAutoformatUrl(false);
              }
            }}
            onPaste={(e) => {
              const pastedUrl = e.clipboardData.getData('text/plain');
              if (isKibanaUrl(pastedUrl)) {
                setAutoformatUrl(true);
              }
            }}
            isInvalid={urlPlaceholderMissing || (touched.url && !currentTemplate.url)}
          />
        </EuiFormRow>
        <EuiFormRow
          fullWidth
          helpText={currentTemplate.encoder.description}
          label={i18n.translate('xpack.graph.settings.drillDowns.urlEncoderInputLabel', {
            defaultMessage: 'URL parameter type',
          })}
        >
          <EuiComboBox
            fullWidth
            singleSelection={{ asPlainText: true }}
            isClearable={false}
            options={outlinkEncoders.map((encoder) => ({ label: encoder.title, value: encoder }))}
            selectedOptions={[
              {
                label: currentTemplate.encoder.title,
                value: currentTemplate.encoder,
              },
            ]}
            onChange={(choices) => {
              // choices[0].value can't be null because `isClearable` is set to false above
              setValue('encoder', choices[0].value!);
            }}
          />
        </EuiFormRow>
        <EuiFormRow
          fullWidth
          label={i18n.translate('xpack.graph.settings.drillDowns.toolbarIconPickerLabel', {
            defaultMessage: 'Toolbar icon',
          })}
        >
          <div
            role="listbox"
            aria-label={i18n.translate(
              'xpack.graph.settings.drillDowns.toolbarIconPickerSelectionAriaLabel',
              {
                defaultMessage: 'Toolbar icon selection',
              }
            )}
          >
            {urlTemplateIconChoices.map((icon) => (
              <IconRenderer
                icon={icon}
                onClick={() => {
                  if (currentTemplate.icon === icon) {
                    setValue('icon', null);
                  } else {
                    setValue('icon', icon);
                  }
                }}
                css={[
                  legacyIconStyles.base(euiThemeContext),
                  legacyIconStyles.pickable(euiThemeContext),
                  icon === currentTemplate.icon && legacyIconStyles.selected,
                ]}
              />
            ))}
          </div>
        </EuiFormRow>
        <EuiFlexGroup justifyContent="flexEnd" responsive={false}>
          <EuiFlexItem grow={false}>
            {
              <EuiButtonEmpty
                color="danger"
                onClick={() => {
                  props.onRemove();
                }}
                data-test-subj="graphRemoveUrlTemplate"
              >
                {isUpdateForm(props)
                  ? i18n.translate('xpack.graph.settings.drillDowns.removeButtonLabel', {
                      defaultMessage: 'Remove',
                    })
                  : i18n.translate('xpack.graph.settings.drillDowns.cancelButtonLabel', {
                      defaultMessage: 'Cancel',
                    })}
              </EuiButtonEmpty>
            }
          </EuiFlexItem>
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={reset} disabled={formUntouched}>
              {i18n.translate('xpack.graph.settings.drillDowns.resetButtonLabel', {
                defaultMessage: 'Reset',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton type="submit" fill isDisabled={urlPlaceholderMissing || formIncomplete}>
              {isUpdateForm(props)
                ? i18n.translate('xpack.graph.settings.drillDowns.updateSaveButtonLabel', {
                    defaultMessage: 'Update drilldown',
                  })
                : i18n.translate('xpack.graph.settings.drillDowns.newSaveButtonLabel', {
                    defaultMessage: 'Save drilldown',
                  })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </form>
    </EuiAccordion>
  );
}

const styles = {
  listAccordion: ({ euiTheme }: UseEuiTheme) =>
    css({
      borderTop: euiTheme.border.thin,
      borderBottom: euiTheme.border.thin,

      '& + &': {
        // If there is another after it, shift up 1px to overlap borders
        marginTop: '-1px',
      },
    }),

  openListAccordion: ({ euiTheme }: UseEuiTheme) =>
    css({
      backgroundColor: euiTheme.colors.body,
    }),

  button: ({ euiTheme }: UseEuiTheme) =>
    css({
      padding: euiTheme.size.m,
    }),
};
