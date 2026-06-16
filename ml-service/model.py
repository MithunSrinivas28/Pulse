import torch
import torch.nn as nn

class LSTMAutoencoder(nn.Module):
    def __init__(self, input_size=2, hidden_size=32, num_layers=1):
        super(LSTMAutoencoder, self).__init__()

        # Encoder — compresses sequence into hidden state
        self.encoder = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )

        # Decoder — reconstructs sequence from hidden state
        self.decoder = nn.LSTM(
            input_size=hidden_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True
        )

        # Maps hidden state back to original feature size
        self.output_layer = nn.Linear(hidden_size, input_size)

    def forward(self, x):
        # x shape: (batch, sequence_length, input_size)

        # Encode — we only keep the final hidden state
        _, (hidden, _) = self.encoder(x)

        # Repeat hidden state across all timesteps for decoder input
        decoder_input = hidden[-1].unsqueeze(1).repeat(1, x.shape[1], 1)

        # Decode — reconstruct the full sequence
        decoder_out, _ = self.decoder(decoder_input)

        # Project back to input feature space
        reconstruction = self.output_layer(decoder_out)
        return reconstruction