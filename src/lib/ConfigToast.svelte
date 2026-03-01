<script>
    import { configToastVisible, configToastMessage } from '../stores.js';
    import { toastError as configToastError } from '../core/toast.js';
</script>

<div id="config-toast" class="config-toast" class:show={$configToastVisible} class:error={$configToastError}>
    {$configToastMessage}
</div>
