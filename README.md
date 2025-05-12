My attempt at implementing a simple version of the clientside encryption outlined [here](https://github.com/standardnotes/app/blob/1d11803f224790ba4a748905bd33e9826b06590a/packages/snjs/specification.md)

Created notes will be encrypted based of a provided password and stored in Indexed DB and will then be decrypted with the same master key. During decryption, if the input password is not the same as the one used when the data was encrypted, decryption will fail.
