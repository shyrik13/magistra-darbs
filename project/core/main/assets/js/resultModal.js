import Tracker from './tracker.js';
const tracker = Tracker.create();

let results = null;

const selector = {
    modal: $('#send-results-modal'),
    modalClose: $('#send-results-modal .btn-close'),
    modalSend: $('#send-results-modal .btn-send'),
};

$(selector.modalClose).on('click', function () {
    results = null;
    selector.modal.find('.modal-fill-field').text("");
    selector.modal.hide();
});

$(selector.modalSend).on('click', function () {
    const url = $(this).data('link');

    if (results) {
        $.ajax({
            url: url,
            type: "POST",
            dataType: 'json',
            data: JSON.stringify(results),
            contentType: "application/json",
            processData: false,
            success: function() {
                location.reload();
            }
        });
    }
});

export function finish(bench) {
    bench = null;
    const successResults = tracker.getResults();

    selector.modal.find('#modal-body-success').show();
    selector.modal.find('#modal-body-error').hide();

    selector.modal.find('#modal-test').text(successResults.name);
    selector.modal.find('#modal-agent').text(successResults.agent);
    selector.modal.find('#modal-gpu-model').text(successResults.gpuModel);
    selector.modal.find('#modal-total-vertex').text(successResults.vertexTotal);
    selector.modal.find('#modal-total-triangles').text(successResults.trianglesTotal);
    selector.modal.find('#modal-init-time').text(`${successResults.initTime} ms`);

    for (let c1 of ['cpu', 'fps', 'heap']) {
        for (let c2 of ['max', 'min', 'avg']) {
            selector.modal.find(`#modal-${c2}-${c1}`).text(successResults[c1][c2]);
        }
    }

    results = successResults;
    selector.modal.show();
}

export function errorFinish(error, bench) {
    bench = null;
    const errorResults = tracker.getErrorResults(error);

    selector.modal.find('#modal-body-success').hide();
    selector.modal.find('#modal-body-error').show();

    selector.modal.find('#modal-test').text(errorResults.name);
    selector.modal.find('#modal-agent').text(errorResults.agent);
    selector.modal.find('#modal-gpu-model').text(errorResults.gpuModel);
    selector.modal.find('#modal-error').text(errorResults.error);

    results = errorResults;
    selector.modal.show();
}