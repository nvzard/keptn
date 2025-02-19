# Keptn API Component

The api component is a Keptn core component and allows the communication with Keptn. Therefore, it provides a defined interface as shown in the `./swagger.yaml`. Besides, it maintains a websocket server to forward Keptn messages to the Keptn CLI, used by the end-user.

## Installation

The api component is installed as a part of [Keptn](https://keptn.sh).

## Deploy in your Kubernetes cluster

To deploy the current version of the api component in your Keptn Kubernetes cluster, use the file `deploy/service.yaml` from this repository and apply it:

```console
kubectl apply -f deploy/service.yaml
```

## Delete in your Kubernetes cluster

To delete a deployed api component, use the file `deploy/service.yaml` from this repository and delete the Kubernetes resources:

```console
kubectl delete -f deploy/service.yaml
```

## Updating the API specification
After a modification to the `swagger.yaml`, the generated code can be updated using the command
NOTE: To avoid re-generating too many files it is recommended to use swagger v0.25.0

```console
swagger generate server -A keptn -P models.Principal -f ./swagger.yaml
```
