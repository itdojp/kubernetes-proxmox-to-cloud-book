#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const REQUIRED_FILES = [
  'docs/introduction/quickstart.md',
  'examples/k8s/addons/envoy-gateway/install.sh',
  'examples/k8s/addons/envoy-gateway/gatewayclass.yaml',
  'examples/k8s/addons/ingress-nginx/install.sh',
  'examples/apps/sample-app/raw-yaml/gateway.yaml',
  'examples/apps/sample-app/raw-yaml/httproute.yaml',
  'examples/apps/sample-app/kustomize/base/kustomization.yaml',
  'examples/apps/sample-app/kustomize/overlays/cloud-prod/kustomization.yaml',
  'examples/apps/sample-app/kustomize/overlays/cloud-prod/ingress.yaml',
  'examples/apps/sample-app/helm/values.yaml',
  'examples/apps/sample-app/helm/values-proxmox-dev.yaml',
  'examples/apps/sample-app/helm/values-cloud-prod.yaml',
  'examples/apps/sample-app/helm/templates/gateway.yaml',
  'examples/apps/sample-app/helm/templates/httproute.yaml',
  'examples/apps/sample-app/helm/templates/ingress.yaml',
  'examples/apps/sample-app/helm/templates/validate.yaml',
];

function readContents() {
  return Object.fromEntries(REQUIRED_FILES.map((relPath) => [
    relPath,
    fs.existsSync(path.join(repoRoot, relPath))
      ? fs.readFileSync(path.join(repoRoot, relPath), 'utf8')
      : null,
  ]));
}

function requireMarkers(contents, relPath, markers, errors) {
  const content = contents[relPath];
  if (typeof content !== 'string') {
    errors.push(`${relPath} is missing.`);
    return;
  }
  for (const marker of markers) {
    if (!content.includes(marker)) errors.push(`${relPath} is missing required marker: ${marker}`);
  }
}

function rejectMarkers(contents, relPath, markers, errors) {
  const content = contents[relPath];
  if (typeof content !== 'string') return;
  for (const marker of markers) {
    if (content.includes(marker)) errors.push(`${relPath} contains retired default marker: ${marker}`);
  }
}

function checkPolicy(contents) {
  const errors = [];

  requireMarkers(contents, 'docs/introduction/quickstart.md', [
    'bash examples/k8s/addons/envoy-gateway/install.sh',
    'kubectl get gatewayclass eg',
    'raw-yaml/gateway.yaml',
    'raw-yaml/httproute.yaml',
  ], errors);
  rejectMarkers(contents, 'docs/introduction/quickstart.md', [
    'bash examples/k8s/addons/ingress-nginx/install.sh',
    'raw-yaml/ingress.yaml',
  ], errors);

  requireMarkers(contents, 'examples/k8s/addons/envoy-gateway/install.sh', [
    'ENVOY_GATEWAY_VERSION="${ENVOY_GATEWAY_VERSION:-v1.8.0}"',
    'oci://docker.io/envoyproxy/gateway-helm',
    'kubectl wait --for=condition=Accepted gatewayclass/eg',
  ], errors);
  requireMarkers(contents, 'examples/k8s/addons/envoy-gateway/gatewayclass.yaml', [
    'kind: GatewayClass',
    'name: eg',
    'controllerName: gateway.envoyproxy.io/gatewayclass-controller',
  ], errors);
  requireMarkers(contents, 'examples/k8s/addons/ingress-nginx/install.sh', [
    'ALLOW_RETIRED_INGRESS_NGINX',
    'reference-only',
    'exit 1',
  ], errors);

  requireMarkers(contents, 'examples/apps/sample-app/raw-yaml/gateway.yaml', [
    'kind: Gateway',
    'gatewayClassName: eg',
    'hostname: sample-app.local',
  ], errors);
  requireMarkers(contents, 'examples/apps/sample-app/raw-yaml/httproute.yaml', [
    'kind: HTTPRoute',
    'name: sample-app',
    'port: 80',
  ], errors);

  requireMarkers(contents, 'examples/apps/sample-app/kustomize/base/kustomization.yaml', [
    '- gateway.yaml',
    '- httproute.yaml',
  ], errors);
  rejectMarkers(contents, 'examples/apps/sample-app/kustomize/base/kustomization.yaml', ['- ingress.yaml'], errors);
  requireMarkers(contents, 'examples/apps/sample-app/kustomize/overlays/cloud-prod/kustomization.yaml', [
    'namespace: sample-app',
    '- ingress.yaml',
    '- path: delete-gateway.yaml',
    '- path: delete-httproute.yaml',
  ], errors);
  requireMarkers(contents, 'examples/apps/sample-app/kustomize/overlays/cloud-prod/ingress.yaml', [
    'kind: Ingress',
    'ingressClassName: alb',
    'host: sample-app.example.com',
  ], errors);

  requireMarkers(contents, 'examples/apps/sample-app/helm/values.yaml', [
    'gateway:',
    'className: eg',
    'className: ""',
  ], errors);
  rejectMarkers(contents, 'examples/apps/sample-app/helm/values.yaml', ['className: nginx'], errors);
  requireMarkers(contents, 'examples/apps/sample-app/helm/values-proxmox-dev.yaml', [
    'gateway:',
    'className: eg',
    'ingress:\n  enabled: false',
  ], errors);
  requireMarkers(contents, 'examples/apps/sample-app/helm/values-cloud-prod.yaml', [
    'gateway:\n  enabled: false',
    'ingress:\n  enabled: true',
    'className: alb',
  ], errors);
  requireMarkers(contents, 'examples/apps/sample-app/helm/templates/gateway.yaml', [
    'kind: Gateway',
    'gatewayClassName:',
  ], errors);
  requireMarkers(contents, 'examples/apps/sample-app/helm/templates/httproute.yaml', ['kind: HTTPRoute'], errors);
  requireMarkers(contents, 'examples/apps/sample-app/helm/templates/ingress.yaml', [
    'kind: Ingress',
    'ingress.className must be set when ingress.enabled=true',
  ], errors);
  requireMarkers(contents, 'examples/apps/sample-app/helm/templates/validate.yaml', [
    'if and .Values.gateway.enabled .Values.ingress.enabled',
    'gateway.enabled and ingress.enabled cannot both be true',
  ], errors);

  return errors;
}

function runSelfTest() {
  const cases = [
    {
      name: 'retired Quickstart installer',
      file: 'docs/introduction/quickstart.md',
      mutate: (value) => value.replace(
        'bash examples/k8s/addons/envoy-gateway/install.sh',
        'bash examples/k8s/addons/ingress-nginx/install.sh',
      ),
    },
    {
      name: 'implicit cloud IngressClass',
      file: 'examples/apps/sample-app/helm/values-cloud-prod.yaml',
      mutate: (value) => value.replace('className: alb', 'className: ""'),
    },
    {
      name: 'unguarded retired installer',
      file: 'examples/k8s/addons/ingress-nginx/install.sh',
      mutate: (value) => value.replaceAll('ALLOW_RETIRED_INGRESS_NGINX', 'UNGUARDED_LEGACY_INSTALL'),
    },
    {
      name: 'cloud resource without namespace contract',
      file: 'examples/apps/sample-app/kustomize/overlays/cloud-prod/kustomization.yaml',
      mutate: (value) => value.replace('namespace: sample-app', 'namespace: ""'),
    },
    {
      name: 'missing Helm exposure mutual exclusion',
      file: 'examples/apps/sample-app/helm/templates/validate.yaml',
      mutate: (value) => value.replace('if and .Values.gateway.enabled .Values.ingress.enabled', 'if false'),
    },
  ];

  for (const testCase of cases) {
    const contents = readContents();
    contents[testCase.file] = testCase.mutate(contents[testCase.file]);
    if (checkPolicy(contents).length === 0) {
      console.error(`❌ Ingress controller policy self-test failed to reject: ${testCase.name}`);
      process.exit(1);
    }
  }
  console.log('✅ Ingress controller policy self-test passed.');
}

function main() {
  if (process.argv.includes('--self-test')) {
    runSelfTest();
    return;
  }
  const errors = checkPolicy(readContents());
  if (errors.length > 0) {
    console.error('❌ Ingress controller policy check failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log('✅ Ingress controller policy check passed.');
}

main();
