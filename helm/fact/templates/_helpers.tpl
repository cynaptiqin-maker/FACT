{{/*
Expand the name of the chart.
*/}}
{{- define "fact.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "fact.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "fact.labels" -}}
helm.sh/chart: {{ include "fact.name" . }}-{{ .Chart.Version }}
app.kubernetes.io/name: {{ include "fact.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Backend image reference
*/}}
{{- define "fact.backendImage" -}}
{{ .Values.global.registry }}/{{ .Values.backend.image.repository }}:{{ .Values.global.imageTag }}
{{- end }}

{{/*
Frontend image reference
*/}}
{{- define "fact.frontendImage" -}}
{{ .Values.global.registry }}/{{ .Values.frontend.image.repository }}:{{ .Values.global.imageTag }}
{{- end }}
