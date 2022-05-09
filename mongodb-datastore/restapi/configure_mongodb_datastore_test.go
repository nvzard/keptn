package restapi

import (
	"context"
	"github.com/keptn/keptn/mongodb-datastore/handlers"
	"github.com/keptn/keptn/mongodb-datastore/restapi/operations"
	"github.com/nats-io/nats-server/v2/server"
	natstest "github.com/nats-io/nats-server/v2/test"
	"github.com/stretchr/testify/require"
	"os"
	"sync"
	"testing"
	"time"
)

// Test_startControlPlane verifies whether the api pre server shutdown is initialized
// and that the control plane terminates after calling it
func Test_startControlPlaneSuccess(t *testing.T) {
	mutex := &sync.Mutex{}
	natsServer, shutdown := func() (*server.Server, func()) {
		svr := natstest.RunRandClientPortServer()
		return svr, func() { svr.Shutdown() }
	}()

	defer shutdown()
	err := os.Setenv("NATS_URL", natsServer.ClientURL())
	require.NoError(t, err)

	api := &operations.MongodbDatastoreAPI{}
	eventRequestHandler := handlers.NewEventRequestHandler(nil)
	ctx := context.TODO()
	go func() {
		err := startControlPlane(ctx, api, eventRequestHandler)
		require.Nil(t, err)
		t.Log("control plane terminated")
	}()
	// test propagate shutdown
	require.Eventually(t, func() bool {
		mutex.Lock()
		defer mutex.Unlock()
		return api.PreServerShutdown != nil
	}, 10*time.Second, 1*time.Second)
	api.PreServerShutdown()
}

func Test_startControlPlaneFailNoNATS(t *testing.T) {
	eventRequestHandler := handlers.NewEventRequestHandler(nil)
	err := startControlPlane(context.TODO(), &operations.MongodbDatastoreAPI{}, eventRequestHandler)
	require.Error(t, err)
	require.Contains(t, err.Error(), "could not connect to NATS")
}