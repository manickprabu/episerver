import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  FormContainer,
  FormFieldsData,
  FormSubmission,
  FormSubmissionData,
  FormSubmitModel,
  FormSubmitResult,
  FormValidationResult,
  ProblemDetail
} from '../models';
import { equals, isNull } from '../utils';
import { FormStorageService } from './form-storage.service';
import { FormValidatorService } from './form-validator.service';

const API_ENDPOINT = '_forms/v1/forms';

@Injectable()
export class FormSubmitService {
  constructor(
    private readonly http: HttpClient,
    private readonly formStorageService: FormStorageService,
    private readonly formValidatorService: FormValidatorService
  ) {}

  combineData(dataFromStorage: FormSubmission[], submissionData: FormSubmission[]): FormSubmission[] {
    const mapFromArray = new Map<string, FormSubmission>();

    submissionData.forEach((element) => {
      mapFromArray.set(element.elementKey, element);
    });

    return [...submissionData, ...dataFromStorage.filter((element) => !mapFromArray.has(element.elementKey))];
  }

  async doSubmit(form: FormContainer, baseUrl: string, model: FormSubmitModel): Promise<FormSubmitResult> {
    const formData = new FormData();
    const formSubmissionData: Partial<FormSubmissionData> = {
      FormKey: model.formKey,
      Locale: model.locale,
      IsFinalized: model.isFinalized,
      SubmissionKey: model.partialSubmissionKey,
      HostedPageUrl: model.hostedPageUrl,
      CurrentStep: model.currentStepIndex
    };
    const fieldsData: FormFieldsData = {};

    model.submissionData.forEach((submission) => {
      const value = submission.value;
      const key = submission.elementKey;

      if (isNull(value)) {
        return;
      }

      if (Array.isArray(value) && value.length > 0 && value[0] !== null && typeof value[0] === 'object') {
        const files = value as Array<{ name: string; file?: File }>;
        let fileNames = '';

        for (let index = 0; index < files.length; index += 1) {
          const file = files[index].file;

          if (file && Object.getPrototypeOf(file) === File.prototype) {
            formData.append(`${key}_file_${index}`, file);
          }

          if (index > 0 && index !== files.length - 1) {
            fileNames += ' | ';
          }

          fileNames += files[index].name;
        }

        formData.append(key, fileNames);
        submission.prevValue = fileNames;
      } else {
        fieldsData[key] = submission.value;
      }
    });

    formSubmissionData.Fields = fieldsData;
    formData.append('data', JSON.stringify(formSubmissionData));

    const currentData = this.formStorageService.loadFormDataFromStorage(form);
    const dataCombined = this.combineData(currentData, model.submissionData);
    this.formStorageService.saveFormDataToStorage(form, dataCombined);

    try {
      const result = await firstValueFrom(
        this.http.put<FormSubmitResult>(`${baseUrl}${API_ENDPOINT}`, formData, {
          headers: new HttpHeaders({
            Authorization: `Bearer ${model.accessToken}`
          })
        })
      );

      if (result.success && model.isFinalized) {
        this.formStorageService.removeFormDataInStorage(form);
      }

      return result;
    } catch (error) {
      if (error instanceof HttpErrorResponse) {
        throw error.error as ProblemDetail;
      }

      throw error;
    }
  }

  doValidate(form: FormContainer, formSubmissions: FormSubmission[]): FormValidationResult[] {
    return form.formElements
      .filter((element) => formSubmissions.some((submission) => equals(submission.elementKey, element.key)))
      .map((element) => {
        const value = formSubmissions.filter((submission) => equals(submission.elementKey, element.key))[0]?.value;
        return {
          elementKey: element.key,
          result: this.formValidatorService.validate(element, value)
        } as FormValidationResult;
      });
  }
}
